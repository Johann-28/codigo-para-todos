import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, firstValueFrom } from 'rxjs';
import { HomeService, LearningPath, CourseModule } from '../shared/home.service';
import { Lesson } from '../models/course-content/lesson.interface';

interface CourseProgressSummary {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  currentModule: string;
  nextLesson: Lesson | null;
}

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

  // Signals for reactive state management
  courseId = signal<string>('');
  course = signal<LearningPath | null>(null);
  modules = signal<CourseModule[]>([]);
  courseProgress = signal<CourseProgressSummary | null>(null);
  selectedModule = signal<CourseModule | null>(null);
  selectedLesson = signal<Lesson | null>(null);
  isLoading = signal(false);
  isLessonLoading = signal(false);
  expandedModules = signal<Set<string>>(new Set());
  showSidebar = signal(true);

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

 ngOnInit() {
  this.route.params.pipe(
    takeUntil(this.destroy$),
    switchMap(params => {
      const courseId = params['id'];
      this.courseId.set(courseId);
      return this.loadCourseData(courseId); 
    })
  ).subscribe({
    next: ([modules, progress]: any) => {
      if (modules && progress) {
        this.modules.set(modules);
        this.courseProgress.set(progress);

        // Auto-expand first incomplete module
        this.autoExpandCurrentModule();

        // Select first lesson if none selected
        if (modules.length > 0 && !this.selectedLesson()) {
          const firstLesson = modules[0].lessons[0];
          if (firstLesson) {
            this.selectLesson(firstLesson, modules[0]);
          }
        }
      }
      this.isLoading.set(false);
    },
    error: (error: any) => {
      console.error('Error loading course data:', error);
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

  return this.homeService.getLearningPaths().pipe(
    takeUntil(this.destroy$),
    switchMap(paths => {
      const course = paths.find(p => p.id === courseId);
      if (!course) {
        this.router.navigate(['/404']);
        return [];
      }

      this.course.set(course);

      return this.homeService.getCourseContent(courseId).pipe(
        switchMap(modules =>
          this.homeService.getCourseProgress(courseId).pipe(
            switchMap(progress => {
              return [[modules, progress]];
            })
          )
        )
      );
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

    // Load detailed lesson content
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
          this.isLessonLoading.set(false);
        }
      });
  }

  completeLesson() {
    const lesson = this.selectedLesson();
    if (!lesson || lesson.isCompleted) return;

    this.homeService.completLesson(lesson.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Update lesson status
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

          // Refresh course progress
          this.refreshProgress();

          // Auto-advance to next lesson
          this.goToNextLesson();
        },
        error: (error) => {
          console.error('Error completing lesson:', error);
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
      this.selectLesson(nextLesson, currentModule);
      return;
    }

    // Try first lesson of next module
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.lessons.length > 0) {
        // Auto-expand next module
        const expanded = new Set(this.expandedModules());
        expanded.add(nextModule.id);
        this.expandedModules.set(expanded);
        
        this.selectLesson(nextModule.lessons[0], nextModule);
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
    if (courseId) {
      this.homeService.getCourseProgress(courseId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(progress => {
          this.courseProgress.set(progress);
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
}