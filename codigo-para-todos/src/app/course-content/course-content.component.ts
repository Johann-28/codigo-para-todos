import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, firstValueFrom, forkJoin, of, tap } from 'rxjs';
import { Lesson } from '../models/course-content/lesson.interface';
import { AuthService } from '../auth/auth.service';
import { HomeService, LearningPath, CourseModule, CourseProgress } from '../shared/diagnostic-evaluation.service';

@Component({
  selector: 'app-course-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './course-content.component.html',
  styleUrls: ['./course-content.component.scss']
})
export class CourseContentComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private homeService = inject(HomeService);
  private authService = inject(AuthService);

  // Signals for reactive state management
  courseId = signal<string>('');
  course = signal<LearningPath | null>(null);
  modules = signal<CourseModule[]>([]);
  courseProgress = signal<CourseProgress | null>(null);
  selectedModule = signal<CourseModule | null>(null);
  selectedLesson = signal<Lesson | null>(null);
  isLoading = signal(false);
  isLessonLoading = signal(false);
  expandedModules = signal<Set<string>>(new Set());
  showSidebar = signal(true);
  error = signal<string | null>(null);

  // Computed values
  totalModules = computed(() => this.modules().length);
  completedModules = computed(() => 
    this.modules().filter(module => 
      module.lessons.every(lesson => lesson.isCompleted)
    ).length
  );

  moduleProgress = computed(() => {
    const modules = this.modules();
    return modules.map(module => {
      const totalLessons = module.lessons.length;
      const completedLessons = module.lessons.filter(l => l.isCompleted).length;
      const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      
      return {
        moduleId: module.id,
        completed: completedLessons,
        total: totalLessons,
        percentage
      };
    });
  });

  nextAvailableLesson = computed(() => {
    const modules = this.modules();
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (!lesson.isCompleted && !lesson.isLocked) {
          return lesson;
        }
      }
    }
    return null;
  });

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit() {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const courseId = params['id'];
        this.courseId.set(courseId);
        return this.loadCourseData(courseId); 
      })
    ).subscribe({
      next: () => {
        console.log('Course data loaded successfully');
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading course data:', error);
        this.error.set('Error loading course content. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCourseData(courseId: string) {
    this.isLoading.set(true);
    this.error.set(null);

    const user = this.currentUser();
    if (!user) {
      this.error.set('Please log in to access course content.');
      return this.router.navigate(['/auth/login']);
    }

    // Load course details, content, and progress in parallel
 return forkJoin({
    paths: this.homeService.getLearningPaths(),
    content: this.homeService.getCourseContent(courseId),
    progress: this.homeService.getCourseProgress(user.id, courseId)
  }).pipe(
    takeUntil(this.destroy$),
    tap(({ paths, content, progress }) => {
      const course = paths.find(p => p.id === courseId);
      if (!course) {
        this.router.navigate(['/404']);
        throw new Error('Course not found');
      }

      this.course.set(course);
      this.modules.set(content);
      this.courseProgress.set(progress);

      this.autoExpandCurrentModule();

      if (content.length > 0 && !this.selectedLesson()) {
        const firstLesson = content[0].lessons[0];
        if (firstLesson) {
          this.selectLesson(firstLesson, content[0]);
        }
      }
    })
  );
}

  private autoExpandCurrentModule() {
    const progress = this.courseProgress();
    if (progress?.nextLesson) {
      const modules = this.modules();
      const currentModule = modules.find(m => 
        m.lessons.some(l => l.id === progress.nextLesson?.id)
      );
      
      if (currentModule) {
        const expanded = new Set(this.expandedModules());
        expanded.add(currentModule.id);
        this.expandedModules.set(expanded);
      }
    }
  }

  toggleModule(moduleId: string) {
    const expanded = new Set(this.expandedModules());
    if (expanded.has(moduleId)) {
      expanded.delete(moduleId);
    } else {
      expanded.add(moduleId);
    }
    this.expandedModules.set(expanded);
  }

  selectLesson(lesson: Lesson, module: CourseModule) {
    if (lesson.isLocked) return;

    this.isLessonLoading.set(true);
    this.selectedLesson.set(lesson);
    this.selectedModule.set(module);

    // Load detailed lesson content from backend
    this.homeService.getLessonContent(lesson.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedLesson) => {
          if (detailedLesson) {
            this.selectedLesson.set(detailedLesson);
          }
          this.isLessonLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading lesson:', error);
          this.error.set('Error loading lesson content.');
          this.isLessonLoading.set(false);
        }
      });
  }

  completeLesson() {
    const lesson = this.selectedLesson();
    const user = this.currentUser();
    
    if (!lesson || lesson.isCompleted || !user) return;

    this.isLoading.set(true);

    this.homeService.completeLesson(user.id, lesson.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update lesson status locally
          lesson.isCompleted = true;
          this.selectedLesson.set({ ...lesson });

          // Update modules signal to trigger reactivity
          const updatedModules = this.modules().map(module => ({
            ...module,
            lessons: module.lessons.map(l => 
              l.id === lesson.id ? { ...l, isCompleted: true } : l
            )
          }));
          this.modules.set(updatedModules);

          // Update overall path progress
          this.updatePathProgress();

          // Refresh course progress
          this.refreshProgress();

          // Auto-advance to next lesson
          this.goToNextLesson();

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error completing lesson:', error);
          this.error.set('Error completing lesson. Please try again.');
          this.isLoading.set(false);
        }
      });
  }

  private updatePathProgress() {
    const user = this.currentUser();
    const courseId = this.courseId();
    const modules = this.modules();

    if (!user || !courseId) return;

    // Calculate overall progress
    const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
    const completedLessons = modules.reduce((total, module) => 
      total + module.lessons.filter(l => l.isCompleted).length, 0
    );
    
    const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    // Update progress in backend
    this.homeService.updatePathProgress(user.id, courseId, progressPercentage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Progress updated successfully');
        },
        error: (error) => {
          console.error('Error updating progress:', error);
        }
      });
  }

  goToNextLesson() {
    const currentLesson = this.selectedLesson();
    const currentModule = this.selectedModule();
    
    if (!currentLesson || !currentModule) return;

    const modules = this.modules();
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);

    // Try next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      if (this.canAccessLesson(nextLesson, currentModule)) {
        this.selectLesson(nextLesson, currentModule);
        return;
      }
    }

    // Try first lesson of next module
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.lessons.length > 0) {
        const firstLesson = nextModule.lessons[0];
        if (this.canAccessLesson(firstLesson, nextModule)) {
          // Auto-expand next module
          const expanded = new Set(this.expandedModules());
          expanded.add(nextModule.id);
          this.expandedModules.set(expanded);
          
          this.selectLesson(firstLesson, nextModule);
        }
      }
    }
  }

  goToPreviousLesson() {
    const currentLesson = this.selectedLesson();
    const currentModule = this.selectedModule();
    
    if (!currentLesson || !currentModule) return;

    const modules = this.modules();
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);

    // Try previous lesson in current module
    if (currentLessonIndex > 0) {
      const prevLesson = currentModule.lessons[currentLessonIndex - 1];
      this.selectLesson(prevLesson, currentModule);
      return;
    }

    // Try last lesson of previous module
    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      if (prevModule.lessons.length > 0) {
        // Auto-expand previous module
        const expanded = new Set(this.expandedModules());
        expanded.add(prevModule.id);
        this.expandedModules.set(expanded);
        
        const lastLesson = prevModule.lessons[prevModule.lessons.length - 1];
        this.selectLesson(lastLesson, prevModule);
      }
    }
  }

  private refreshProgress() {
    const courseId = this.courseId();
    const user = this.currentUser();
    
    if (courseId && user) {
      this.homeService.getCourseProgress(user.id, courseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (progress) => {
            this.courseProgress.set(progress);
          },
          error: (error) => {
            console.error('Error refreshing progress:', error);
          }
        });
    }
  }

  toggleSidebar() {
    this.showSidebar.set(!this.showSidebar());
  }

  backToCourse() {
    this.router.navigate(['/home']);
  }

  getLessonIcon(type: string): string {
    const icons = {
      'video': '🎥',
      'reading': '📖',
      'exercise': '💻',
      'quiz': '❓',
      'project': '🚀'
    };
    return icons[type as keyof typeof icons] || '📄';
  }

  getLessonTypeText(type: string): string {
    const types = {
      'video': 'Video',
      'reading': 'Reading',
      'exercise': 'Exercise',
      'quiz': 'Quiz',
      'project': 'Project'
    };
    return types[type as keyof typeof types] || 'Content';
  }

  formatDuration(duration: string): string {
    return duration
      .replace('min', ' min')
      .replace('hour', ' hour')
      .replace('hours', ' hours');
  }

  isModuleExpanded(moduleId: string): boolean {
    return this.expandedModules().has(moduleId);
  }

  getModuleProgress(moduleId: string): number {
    const progress = this.moduleProgress().find(p => p.moduleId === moduleId);
    return progress?.percentage || 0;
  }

  canAccessLesson(lesson: Lesson, module: CourseModule): boolean {
    // First lesson is always accessible
    const lessonIndex = module.lessons.findIndex(l => l.id === lesson.id);
    if (lessonIndex === 0) return true;

    // Check if previous lesson is completed
    const previousLesson = module.lessons[lessonIndex - 1];
    return previousLesson?.isCompleted || false;
  }

  retryLoading() {
    this.error.set(null);
    const courseId = this.courseId();
    if (courseId) {
      this.loadCourseData(courseId);
    }
  }
}