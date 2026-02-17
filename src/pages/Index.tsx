import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useToast } from "@/hooks/use-toast";

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  emoji: string;
}

interface WorkoutDay {
  id: string;
  dayName: string;
  dayShort: string;
  dayIndex: number;
  title: string;
  exercises: Exercise[];
  color: string;
}

const WORKOUT_PLAN: WorkoutDay[] = [
  {
    id: "mon",
    dayName: "Понедельник",
    dayShort: "Пн",
    dayIndex: 1,
    title: "Верхняя часть тела",
    color: "bg-emerald-500",
    exercises: [
      { id: "mon-1", name: "Отжимания", sets: 3, reps: "12", emoji: "💪" },
      { id: "mon-2", name: "Планка", sets: 3, reps: "30 сек", emoji: "🧘" },
      { id: "mon-3", name: "Подъём гантелей на бицепс", sets: 3, reps: "10", emoji: "🏋️" },
      { id: "mon-4", name: "Жим гантелей стоя", sets: 3, reps: "10", emoji: "💥" },
    ],
  },
  {
    id: "wed",
    dayName: "Среда",
    dayShort: "Ср",
    dayIndex: 3,
    title: "Кардио + Кор",
    color: "bg-orange-500",
    exercises: [
      { id: "wed-1", name: "Берпи", sets: 3, reps: "8", emoji: "🔥" },
      { id: "wed-2", name: "Скручивания", sets: 3, reps: "15", emoji: "🎯" },
      { id: "wed-3", name: "Прыжки на месте", sets: 3, reps: "30 сек", emoji: "⚡" },
      { id: "wed-4", name: "Велосипед", sets: 3, reps: "20", emoji: "🚴" },
    ],
  },
  {
    id: "fri",
    dayName: "Пятница",
    dayShort: "Пт",
    dayIndex: 5,
    title: "Нижняя часть тела",
    color: "bg-violet-500",
    exercises: [
      { id: "fri-1", name: "Приседания", sets: 4, reps: "15", emoji: "🦵" },
      { id: "fri-2", name: "Выпады", sets: 3, reps: "12 на ногу", emoji: "🏃" },
      { id: "fri-3", name: "Ягодичный мостик", sets: 3, reps: "15", emoji: "🍑" },
      { id: "fri-4", name: "Подъём на носки", sets: 3, reps: "20", emoji: "🦶" },
    ],
  },
];

function getWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `week-${now.getFullYear()}-${weekNumber}`;
}

function getCurrentDayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

function getNextWorkoutReminder(completed: Record<string, boolean>): string | null {
  const currentDay = getCurrentDayIndex();
  const currentHour = new Date().getHours();

  for (const day of WORKOUT_PLAN) {
    const dayCompleted = day.exercises.every((ex) => completed[ex.id]);
    if (day.dayIndex === currentDay && !dayCompleted && currentHour < 21) {
      return `Сегодня тренировка: ${day.title}`;
    }
    if (day.dayIndex === currentDay + 1) {
      return `Завтра: ${day.title}`;
    }
  }
  return null;
}

const Index = () => {
  const weekKey = getWeekKey();
  const { toast } = useToast();

  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`fittrack-${weekKey}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTab, setActiveTab] = useState("schedule");

  useEffect(() => {
    localStorage.setItem(`fittrack-${weekKey}`, JSON.stringify(completed));
  }, [completed, weekKey]);

  const toggleExercise = (exerciseId: string) => {
    setCompleted((prev) => {
      const next = { ...prev, [exerciseId]: !prev[exerciseId] };

      const day = WORKOUT_PLAN.find((d) =>
        d.exercises.some((e) => e.id === exerciseId)
      );
      if (day && !prev[exerciseId]) {
        const allDone = day.exercises.every((e) =>
          e.id === exerciseId ? true : next[e.id]
        );
        if (allDone) {
          toast({
            title: "🎉 Тренировка завершена!",
            description: `${day.title} — отличная работа!`,
          });
        }
      }

      return next;
    });
  };

  const totalExercises = WORKOUT_PLAN.reduce(
    (sum, day) => sum + day.exercises.length,
    0
  );
  const completedCount = WORKOUT_PLAN.reduce(
    (sum, day) =>
      sum + day.exercises.filter((ex) => completed[ex.id]).length,
    0
  );
  const weekProgress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const currentDay = getCurrentDayIndex();
  const reminder = getNextWorkoutReminder(completed);

  const resetWeek = () => {
    setCompleted({});
    toast({ title: "Неделя сброшена", description: "Начни новую неделю с чистого листа!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <header className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              FitTrack
            </h1>
            <Button variant="ghost" size="icon" onClick={resetWeek} title="Сбросить неделю">
              <Icon name="RotateCcw" size={18} />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">Твой план тренировок на неделю</p>
        </header>

        {reminder && (
          <Card className="mb-5 p-4 border-primary/20 bg-accent/50 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name="Bell" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{reminder}</p>
                <p className="text-xs text-muted-foreground">Не пропускай тренировку!</p>
              </div>
            </div>
          </Card>
        )}

        <Card className="mb-6 p-4 animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Прогресс недели</span>
            <span className="text-sm font-bold text-primary">{weekProgress}%</span>
          </div>
          <Progress value={weekProgress} className="h-2.5 mb-2" />
          <p className="text-xs text-muted-foreground">
            {completedCount} из {totalExercises} упражнений выполнено
          </p>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <TabsList className="grid w-full grid-cols-2 mb-5">
            <TabsTrigger value="schedule" className="gap-2">
              <Icon name="Calendar" size={16} />
              Расписание
            </TabsTrigger>
            <TabsTrigger value="workouts" className="gap-2">
              <Icon name="Dumbbell" size={16} />
              Тренировки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-3 mt-0">
            {WORKOUT_PLAN.map((day, idx) => {
              const dayDone = day.exercises.every((ex) => completed[ex.id]);
              const dayCompletedCount = day.exercises.filter(
                (ex) => completed[ex.id]
              ).length;
              const isToday = currentDay === day.dayIndex;

              return (
                <Card
                  key={day.id}
                  className={`p-4 transition-all ${
                    isToday ? "ring-2 ring-primary/30 shadow-md" : ""
                  } ${dayDone ? "opacity-75" : ""}`}
                  style={{ animationDelay: `${idx * 0.06}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${day.color} flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {day.dayShort}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">
                            {day.title}
                          </h3>
                          {isToday && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">
                              сегодня
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {day.dayName} · {day.exercises.length} упр.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {dayDone ? (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-scale-check">
                          <Icon name="Check" size={16} className="text-primary-foreground" />
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">
                          {dayCompletedCount}/{day.exercises.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {day.exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg transition-all cursor-pointer ${
                          completed[exercise.id]
                            ? "bg-primary/5"
                            : "bg-muted/50 hover:bg-muted"
                        }`}
                        onClick={() => toggleExercise(exercise.id)}
                      >
                        <Checkbox
                          checked={!!completed[exercise.id]}
                          onCheckedChange={() => toggleExercise(exercise.id)}
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-lg leading-none">{exercise.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium transition-all ${
                              completed[exercise.id]
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {exercise.name}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {exercise.sets}×{exercise.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="workouts" className="space-y-4 mt-0">
            <div className="grid gap-3">
              {WORKOUT_PLAN.map((day) => {
                const dayCompletedCount = day.exercises.filter(
                  (ex) => completed[ex.id]
                ).length;
                const dayProgress =
                  day.exercises.length > 0
                    ? Math.round(
                        (dayCompletedCount / day.exercises.length) * 100
                      )
                    : 0;

                return (
                  <Card key={day.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-2 h-10 rounded-full ${day.color}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-foreground">
                          {day.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {day.dayName}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-foreground">
                        {dayProgress}%
                      </span>
                    </div>
                    <Progress value={dayProgress} className="h-1.5" />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {day.exercises.map((ex) => (
                        <Badge
                          key={ex.id}
                          variant={completed[ex.id] ? "default" : "outline"}
                          className={`text-xs cursor-pointer transition-all ${
                            completed[ex.id]
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleExercise(ex.id)}
                        >
                          {ex.emoji} {ex.name}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="Info" size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Советы</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Разминка 5-10 минут перед каждой тренировкой</li>
                <li>• Отдых между подходами: 30-60 секунд</li>
                <li>• Пей воду между упражнениями</li>
                <li>• Прогресс сохраняется автоматически</li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "schedule"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon name="Calendar" size={20} />
            <span className="text-[11px] font-medium">Расписание</span>
          </button>
          <button
            onClick={() => setActiveTab("workouts")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              activeTab === "workouts"
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Icon name="Dumbbell" size={20} />
            <span className="text-[11px] font-medium">Тренировки</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Index;
