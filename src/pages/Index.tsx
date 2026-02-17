import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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

const DAYS_LIST = [
  { name: "Понедельник", short: "Пн", index: 1 },
  { name: "Вторник", short: "Вт", index: 2 },
  { name: "Среда", short: "Ср", index: 3 },
  { name: "Четверг", short: "Чт", index: 4 },
  { name: "Пятница", short: "Пт", index: 5 },
  { name: "Суббота", short: "Сб", index: 6 },
  { name: "Воскресенье", short: "Вс", index: 7 },
];

const COLORS = [
  "bg-emerald-500",
  "bg-orange-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
];

const EMOJI_LIST = ["💪", "🧘", "🏋️", "💥", "🔥", "🎯", "⚡", "🚴", "🦵", "🏃", "🍑", "🦶", "❤️", "🏊", "⭐"];

const DEFAULT_PLAN: WorkoutDay[] = [
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

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const Index = () => {
  const weekKey = getWeekKey();
  const { toast } = useToast();

  const [plan, setPlan] = useState<WorkoutDay[]>(() => {
    const saved = localStorage.getItem("fittrack-plan");
    return saved ? JSON.parse(saved) : DEFAULT_PLAN;
  });

  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem(`fittrack-${weekKey}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [activeTab, setActiveTab] = useState("schedule");
  const [editMode, setEditMode] = useState(false);

  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayIndex, setNewDayIndex] = useState(2);
  const [newDayTitle, setNewDayTitle] = useState("");
  const [newDayColor, setNewDayColor] = useState("bg-blue-500");

  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [newExName, setNewExName] = useState("");
  const [newExSets, setNewExSets] = useState("3");
  const [newExReps, setNewExReps] = useState("12");
  const [newExEmoji, setNewExEmoji] = useState("💪");

  const [showEditExercise, setShowEditExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState<{ dayId: string; exercise: Exercise } | null>(null);
  const [editExName, setEditExName] = useState("");
  const [editExSets, setEditExSets] = useState("");
  const [editExReps, setEditExReps] = useState("");
  const [editExEmoji, setEditExEmoji] = useState("💪");

  useEffect(() => {
    localStorage.setItem("fittrack-plan", JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    localStorage.setItem(`fittrack-${weekKey}`, JSON.stringify(completed));
  }, [completed, weekKey]);

  const toggleExercise = (exerciseId: string) => {
    if (editMode) return;
    setCompleted((prev) => {
      const next = { ...prev, [exerciseId]: !prev[exerciseId] };
      const day = plan.find((d) => d.exercises.some((e) => e.id === exerciseId));
      if (day && !prev[exerciseId]) {
        const allDone = day.exercises.every((e) => (e.id === exerciseId ? true : next[e.id]));
        if (allDone) {
          toast({ title: "Тренировка завершена!", description: `${day.title} — отличная работа!` });
        }
      }
      return next;
    });
  };

  const addDay = () => {
    if (!newDayTitle.trim()) return;
    const dayInfo = DAYS_LIST[newDayIndex];
    const newDay: WorkoutDay = {
      id: generateId(),
      dayName: dayInfo.name,
      dayShort: dayInfo.short,
      dayIndex: dayInfo.index,
      title: newDayTitle.trim(),
      color: newDayColor,
      exercises: [],
    };
    setPlan((prev) => [...prev, newDay].sort((a, b) => a.dayIndex - b.dayIndex));
    setNewDayTitle("");
    setShowAddDay(false);
    toast({ title: "День добавлен", description: `${dayInfo.name}: ${newDayTitle}` });
  };

  const removeDay = (dayId: string) => {
    setPlan((prev) => prev.filter((d) => d.id !== dayId));
    toast({ title: "День удалён" });
  };

  const openAddExercise = (dayId: string) => {
    setEditingDayId(dayId);
    setNewExName("");
    setNewExSets("3");
    setNewExReps("12");
    setNewExEmoji("💪");
    setShowAddExercise(true);
  };

  const addExercise = () => {
    if (!newExName.trim() || !editingDayId) return;
    const ex: Exercise = {
      id: generateId(),
      name: newExName.trim(),
      sets: parseInt(newExSets) || 3,
      reps: newExReps.trim() || "12",
      emoji: newExEmoji,
    };
    setPlan((prev) =>
      prev.map((d) => (d.id === editingDayId ? { ...d, exercises: [...d.exercises, ex] } : d))
    );
    setShowAddExercise(false);
    toast({ title: "Упражнение добавлено" });
  };

  const openEditExercise = (dayId: string, exercise: Exercise) => {
    setEditingExercise({ dayId, exercise });
    setEditExName(exercise.name);
    setEditExSets(String(exercise.sets));
    setEditExReps(exercise.reps);
    setEditExEmoji(exercise.emoji);
    setShowEditExercise(true);
  };

  const saveEditExercise = () => {
    if (!editingExercise || !editExName.trim()) return;
    setPlan((prev) =>
      prev.map((d) =>
        d.id === editingExercise.dayId
          ? {
              ...d,
              exercises: d.exercises.map((e) =>
                e.id === editingExercise.exercise.id
                  ? { ...e, name: editExName.trim(), sets: parseInt(editExSets) || 3, reps: editExReps.trim() || "12", emoji: editExEmoji }
                  : e
              ),
            }
          : d
      )
    );
    setShowEditExercise(false);
    toast({ title: "Упражнение обновлено" });
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setPlan((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) } : d
      )
    );
    setShowEditExercise(false);
    toast({ title: "Упражнение удалено" });
  };

  const getReminder = useCallback((): string | null => {
    const currentDay = getCurrentDayIndex();
    const currentHour = new Date().getHours();
    for (const day of plan) {
      const dayCompleted = day.exercises.length > 0 && day.exercises.every((ex) => completed[ex.id]);
      if (day.dayIndex === currentDay && !dayCompleted && currentHour < 21 && day.exercises.length > 0) {
        return `Сегодня тренировка: ${day.title}`;
      }
      if (day.dayIndex === currentDay + 1 && day.exercises.length > 0) {
        return `Завтра: ${day.title}`;
      }
    }
    return null;
  }, [plan, completed]);

  const totalExercises = plan.reduce((sum, day) => sum + day.exercises.length, 0);
  const completedCount = plan.reduce(
    (sum, day) => sum + day.exercises.filter((ex) => completed[ex.id]).length,
    0
  );
  const weekProgress = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;
  const currentDay = getCurrentDayIndex();
  const reminder = getReminder();

  const resetWeek = () => {
    setCompleted({});
    toast({ title: "Неделя сброшена", description: "Начни новую неделю с чистого листа!" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <header className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">FitTrack</h1>
            <div className="flex items-center gap-1">
              <Button
                variant={editMode ? "default" : "ghost"}
                size="icon"
                onClick={() => setEditMode(!editMode)}
                title={editMode ? "Готово" : "Редактировать"}
              >
                <Icon name={editMode ? "Check" : "Pencil"} size={18} />
              </Button>
              <Button variant="ghost" size="icon" onClick={resetWeek} title="Сбросить неделю">
                <Icon name="RotateCcw" size={18} />
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {editMode ? "Режим редактирования — меняй план под себя" : "Твой план тренировок на неделю"}
          </p>
        </header>

        {!editMode && reminder && (
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

        {!editMode && (
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
        )}

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
            {plan.map((day) => {
              const dayDone = day.exercises.length > 0 && day.exercises.every((ex) => completed[ex.id]);
              const dayCompletedCount = day.exercises.filter((ex) => completed[ex.id]).length;
              const isToday = currentDay === day.dayIndex;

              return (
                <Card
                  key={day.id}
                  className={`p-4 transition-all ${isToday && !editMode ? "ring-2 ring-primary/30 shadow-md" : ""} ${dayDone && !editMode ? "opacity-75" : ""}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${day.color} flex items-center justify-center text-white text-xs font-bold`}>
                        {day.dayShort}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">{day.title}</h3>
                          {isToday && !editMode && (
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
                    <div className="text-right flex items-center gap-1">
                      {editMode ? (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeDay(day.id)}>
                          <Icon name="Trash2" size={16} />
                        </Button>
                      ) : dayDone ? (
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
                          !editMode && completed[exercise.id] ? "bg-primary/5" : "bg-muted/50 hover:bg-muted"
                        }`}
                        onClick={() => (editMode ? openEditExercise(day.id, exercise) : toggleExercise(exercise.id))}
                      >
                        {editMode ? (
                          <div className="w-5 h-5 rounded flex items-center justify-center shrink-0">
                            <Icon name="GripVertical" size={14} className="text-muted-foreground" />
                          </div>
                        ) : (
                          <Checkbox
                            checked={!!completed[exercise.id]}
                            onCheckedChange={() => toggleExercise(exercise.id)}
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <span className="text-lg leading-none">{exercise.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium transition-all ${!editMode && completed[exercise.id] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {exercise.name}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {editMode ? (
                            <Icon name="ChevronRight" size={14} />
                          ) : (
                            `${exercise.sets}×${exercise.reps}`
                          )}
                        </span>
                      </div>
                    ))}

                    {editMode && (
                      <button
                        onClick={() => openAddExercise(day.id)}
                        className="flex items-center gap-2 w-full p-2.5 rounded-lg border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                      >
                        <Icon name="Plus" size={16} />
                        <span className="text-sm">Добавить упражнение</span>
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}

            {editMode && (
              <button
                onClick={() => {
                  setNewDayTitle("");
                  setNewDayColor(COLORS[plan.length % COLORS.length]);
                  const usedDays = plan.map((d) => d.dayIndex);
                  const freeDayIdx = DAYS_LIST.findIndex((d) => !usedDays.includes(d.index));
                  setNewDayIndex(freeDayIdx >= 0 ? freeDayIdx : 0);
                  setShowAddDay(true);
                }}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
              >
                <Icon name="Plus" size={20} />
                <span className="text-sm font-medium">Добавить день тренировки</span>
              </button>
            )}
          </TabsContent>

          <TabsContent value="workouts" className="space-y-4 mt-0">
            <div className="grid gap-3">
              {plan.map((day) => {
                const dayCompletedCount = day.exercises.filter((ex) => completed[ex.id]).length;
                const dayProgress = day.exercises.length > 0 ? Math.round((dayCompletedCount / day.exercises.length) * 100) : 0;

                return (
                  <Card key={day.id} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-2 h-10 rounded-full ${day.color}`} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-foreground">{day.title}</h3>
                        <p className="text-xs text-muted-foreground">{day.dayName}</p>
                      </div>
                      <span className="text-lg font-bold text-foreground">{dayProgress}%</span>
                    </div>
                    <Progress value={dayProgress} className="h-1.5" />
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {day.exercises.map((ex) => (
                        <Badge
                          key={ex.id}
                          variant={completed[ex.id] ? "default" : "outline"}
                          className={`text-xs cursor-pointer transition-all ${
                            completed[ex.id] ? "bg-primary text-primary-foreground" : "hover:bg-muted"
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
                <li>• Нажми карандаш вверху, чтобы изменить план</li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-lg border-t">
        <div className="max-w-lg mx-auto flex">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeTab === "schedule" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon name="Calendar" size={20} />
            <span className="text-[11px] font-medium">Расписание</span>
          </button>
          <button
            onClick={() => setActiveTab("workouts")}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${activeTab === "workouts" ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon name="Dumbbell" size={20} />
            <span className="text-[11px] font-medium">Тренировки</span>
          </button>
        </div>
      </nav>

      <Dialog open={showAddDay} onOpenChange={setShowAddDay}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Новый день тренировки</DialogTitle>
            <DialogDescription>Выбери день недели и название тренировки</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">День недели</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_LIST.map((d, idx) => (
                  <button
                    key={d.index}
                    onClick={() => setNewDayIndex(idx)}
                    className={`w-10 h-10 rounded-lg text-xs font-bold transition-all ${
                      newDayIndex === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {d.short}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Название</label>
              <Input
                placeholder="Например: Кардио"
                value={newDayTitle}
                onChange={(e) => setNewDayTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDay()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Цвет</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewDayColor(c)}
                    className={`w-8 h-8 rounded-full ${c} transition-all ${newDayColor === c ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDay(false)}>Отмена</Button>
            <Button onClick={addDay} disabled={!newDayTitle.trim()}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Новое упражнение</DialogTitle>
            <DialogDescription>Добавь упражнение в тренировку</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Иконка</label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_LIST.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewExEmoji(e)}
                    className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                      newExEmoji === e ? "bg-primary/10 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Название</label>
              <Input placeholder="Например: Приседания" value={newExName} onChange={(e) => setNewExName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Подходы</label>
                <Input type="number" min="1" value={newExSets} onChange={(e) => setNewExSets(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Повторения</label>
                <Input placeholder="12 или 30 сек" value={newExReps} onChange={(e) => setNewExReps(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExercise(false)}>Отмена</Button>
            <Button onClick={addExercise} disabled={!newExName.trim()}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditExercise} onOpenChange={setShowEditExercise}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Редактировать упражнение</DialogTitle>
            <DialogDescription>Измени параметры или удали упражнение</DialogDescription>
          </DialogHeader>
          {editingExercise && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Иконка</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_LIST.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEditExEmoji(e)}
                      className={`w-10 h-10 rounded-lg text-lg flex items-center justify-center transition-all ${
                        editExEmoji === e ? "bg-primary/10 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Название</label>
                <Input value={editExName} onChange={(e) => setEditExName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Подходы</label>
                  <Input type="number" min="1" value={editExSets} onChange={(e) => setEditExSets(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Повторения</label>
                  <Input value={editExReps} onChange={(e) => setEditExReps(e.target.value)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="destructive"
              onClick={() => editingExercise && removeExercise(editingExercise.dayId, editingExercise.exercise.id)}
            >
              <Icon name="Trash2" size={16} className="mr-1" />
              Удалить
            </Button>
            <Button onClick={saveEditExercise} disabled={!editExName.trim()}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
