"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pocketbase";
import { StatsCarousel } from "@/components/dashboard/shared/stats/StatsCarousel";
import { DashboardActionBar } from "@/components/dashboard/shared/DashboardActionBar";
import {
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  Plus,
  ArrowRight,
  Monitor,
  Activity,
  User,
  Hash,
  Trash2 as LucideTrash2,
  Archive,
  RotateCcw,
  Search,
  Check,
  CalendarDays as CalendarIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DashboardLoader } from "@/components/dashboard/shared/DashboardLoader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Intake {
  id: string;
  name: string;
  code: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface CourseIntake {
  id: string;
  course: string;
  intake: string;
  course_status: string;
  expand?: {
    course?: Course;
    intake?: Intake;
  };
}

interface CourseSubject {
  id: string;
  course_intake: string;
  subject: string;
  lecturer: string;
  expand?: {
    subject?: Subject | Subject[];
    course_intake?: CourseIntake;
    lecturer?: Lecturer;
  };
}

interface Lecturer {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface ZoomClass {
  id: string;
  title: string;
  description?: string;
  zoom_meeting_id?: string;
  start_time: string;
  duration: number;
  status: string;
  is_recurring: boolean;
  recurrence_day?: string;
  expand?: {
    lecturer?: Lecturer;
    course_subject?: CourseSubject | CourseSubject[];
  };
}

export default function ClassManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ZoomClass[]>([]);
  const [filter, setFilter] = useState<string>("scheduled");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [ongoingSubjects, setOngoingSubjects] = useState<CourseSubject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState("");
  const [durationHour, setDurationHour] = useState<string>("1");
  const [durationMinute, setDurationMinute] = useState<string>("0");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    new Date(),
  );
  const [now] = useState(() => Date.now());

  const [formData, setFormData] = useState({
    description: "",
    lecturer: "",
  });

  const getNearestHourDefaults = useCallback(() => {
    const now = new Date();
    let h = now.getHours();
    if (now.getMinutes() > 0) h += 1;
    if (h >= 24) h = 0;
    const amPm = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { hour: String(h12).padStart(2, "0"), amPm };
  }, []);

  const [scheduleHour, setScheduleHour] = useState<string>(
    () => getNearestHourDefaults().hour,
  );
  const [scheduleMinute, setScheduleMinute] = useState<string>("00");
  const [scheduleAmPm, setScheduleAmPm] = useState<string>(
    () => getNearestHourDefaults().amPm,
  );

  const fetchData = useCallback(async () => {
    try {
      const records = await pb
        .collection("classes")
        .getFullList({
          sort: "-start_time",
          expand:
            "course_subject.subject,course_subject.course_intake.course,course_subject.course_intake.intake,lecturer",
        })
        .catch(() => []);

      setClasses((records as unknown as ZoomClass[]) || []);
      setLoading(false);
    } catch {
      setClasses([]);
      setLoading(false);
    }
  }, []);

  const fetchLecturers = useCallback(async () => {
    try {
      const records = await pb.collection("users").getFullList({
        filter: 'role = "lecturer"',
      });
      setLecturers(records as unknown as Lecturer[]);
    } catch (err: unknown) {
      console.error("Error fetching lecturers:", err);
    }
  }, []);

  const fetchOngoingSubjects = useCallback(async () => {
    try {
      const records = await pb.collection("course_subjects").getFullList({
        filter: 'course_intake.course_status = "ongoing"',
        expand: "subject,course_intake.course,course_intake.intake",
      });
      setOngoingSubjects(records as unknown as CourseSubject[]);
    } catch (err: unknown) {
      console.error("Error fetching ongoing subjects:", err);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = false;

    const start = async () => {
      await fetchData();
      await fetchLecturers();
      await fetchOngoingSubjects();

      try {
        await pb.collection("classes").subscribe("*", () => fetchData());
        isSubscribed = true;
      } catch (error) {
        console.error("Real-time subscription failed:", error);
      }
    };

    start();

    return () => {
      if (isSubscribed) {
        pb.collection("classes")
          .unsubscribe("*")
          .catch(() => {});
      }
    };
  }, [fetchData, fetchLecturers, fetchOngoingSubjects]);

  const handleCreateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!scheduleDate) {
        toast.error("Please select a date.");
        return;
      }

      let hourNum = parseInt(scheduleHour);
      if (scheduleAmPm === "PM" && hourNum !== 12) hourNum += 12;
      if (scheduleAmPm === "AM" && hourNum === 12) hourNum = 0;

      const finalDate = new Date(scheduleDate);
      finalDate.setHours(hourNum, parseInt(scheduleMinute), 0, 0);

      const totalDuration =
        parseInt(durationHour) * 60 + parseInt(durationMinute);

      if (selectedSubjectIds.length === 0) {
        toast.error("Please select at least one subject.");
        return;
      }

      if (!formData.lecturer) {
        toast.error("Please assign a lecturer.");
        return;
      }

      // Resolve subject names for the title
      const selectedSubjectsData = ongoingSubjects.filter((s) =>
        selectedSubjectIds.includes(s.id),
      );
      const generatedTitle = Array.from(
        new Set(
          selectedSubjectsData
            .map((s) => {
              const subjectData = s.expand?.subject;
              return Array.isArray(subjectData)
                ? subjectData[0]?.name
                : subjectData?.name;
            })
            .filter(Boolean),
        ),
      ).join(" & ");

      await pb.collection("classes").create({
        title: generatedTitle || "Untitled Class",
        description: formData.description,
        lecturer: formData.lecturer,
        course_subject: selectedSubjectIds,
        duration: totalDuration,
        start_time: finalDate.toISOString(),
        status: "scheduled",
      });

      toast.success("Class scheduled successfully!");
      setIsModalOpen(false);
      setCurrentStep(1);
      setFormData({
        description: "",
        lecturer: "",
      });
      setSelectedSubjectIds([]);
      setSubjectSearchTerm("");
      setDurationHour("1");
      setDurationMinute("0");
      setScheduleDate(new Date());
      const resetDefaults = getNearestHourDefaults();
      setScheduleHour(resetDefaults.hour);
      setScheduleMinute("00");
      setScheduleAmPm(resetDefaults.amPm);
      fetchData();
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error("Failed to schedule class");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to end and archive this session? This will preserve attendance but close the live room.",
      )
    )
      return;
    try {
      await pb.collection("classes").update(classId, {
        status: "completed",
      });

      toast.success("Class ended and archived successfully!");
      fetchData();
    } catch (error) {
      console.error("Error archiving class:", error);
      toast.error("Failed to archive class.");
    }
  };

  const handleReopenClass = async (classId: string) => {
    try {
      await pb.collection("classes").update(classId, {
        status: "scheduled",
      });
      toast.success("Class reopened successfully! Status set to Scheduled.");
      fetchData();
    } catch (error) {
      console.error("Error reopening class:", error);
      toast.error("Failed to reopen class");
    }
  };

  const stats = {
    scheduled: classes.filter((c) => c.status === "scheduled").length,
    inProgress: classes.filter((c) => c.status === "in_progress").length,
    completed: classes.filter((c) => c.status === "completed").length,
    cancelled: classes.filter((c) => c.status === "cancelled").length,
  };

  const filteredClasses = classes.filter((classItem) => {
    const matchesSearch = classItem.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const scheduledEnd =
      new Date(classItem.start_time).getTime() + classItem.duration * 60000;
    const isWithinTimeWindow = now < scheduledEnd;
    const isEndedEarly = classItem.status === "completed" && isWithinTimeWindow;

    // Treat 'ended early' classes as 'scheduled' for tab filtering
    const effectiveStatus = isEndedEarly ? "scheduled" : classItem.status;

    const matchesFilter =
      filter === "scheduled"
        ? effectiveStatus === "scheduled" || effectiveStatus === "in_progress"
        : effectiveStatus === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Page Header Card */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 ring-8 ring-indigo-50">
            <Monitor size={40} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Class <span className="text-indigo-600">Scheduler</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <Activity size={14} className="text-indigo-400" />
              Real-time Session Monitoring
            </p>
          </div>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 uppercase">
              <Plus size={18} />
              SCHEDULE CLASS
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-fit w-[95vw] max-h-[90vh] overflow-y-auto bg-white rounded-t-[32px] sm:rounded-3xl p-0 border-none">
            <div className="p-8 space-y-6">
              <DialogHeader className="sr-only">
                <DialogTitle>Schedule New Class</DialogTitle>
              </DialogHeader>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black">
                  {currentStep === 1 ? (
                    <Search size={20} />
                  ) : (
                    <Plus size={20} />
                  )}
                </div>
                <div>
                  <h2 className="font-black text-gray-900 uppercase tracking-tight">
                    {currentStep === 1
                      ? "Step 1: Select Subjects"
                      : "Step 2: Session Details"}
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {currentStep === 1
                      ? "Search and pick subjects for this session"
                      : "Setup timing and assign host"}
                  </p>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (currentStep === 1) {
                    if (selectedSubjectIds.length > 0) setCurrentStep(2);
                    else toast.error("Please select at least one subject");
                  } else handleCreateClass(e);
                }}
                className="space-y-4"
              >
                {currentStep === 1 ? (
                  <div className="min-w-[400px] space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                          Search Ongoing Subjects
                        </label>
                        <div className="relative">
                          <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            placeholder="Type to search..."
                            value={subjectSearchTerm}
                            onChange={(e) =>
                              setSubjectSearchTerm(e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all text-sm"
                          />
                        </div>
                      </div>

                      {subjectSearchTerm.length > 0 ? (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar border border-gray-50 rounded-2xl p-2 bg-gray-50/30">
                          {ongoingSubjects
                            .filter((item) => {
                              const subjectName = Array.isArray(
                                item.expand?.subject,
                              )
                                ? item.expand?.subject[0]?.name
                                : item.expand?.subject?.name;
                              return `${subjectName} ${item.expand?.course_intake?.expand?.intake?.code}`
                                .toLowerCase()
                                .includes(subjectSearchTerm.toLowerCase());
                            })
                            .map((cs) => {
                              const isSelected = selectedSubjectIds.includes(
                                cs.id,
                              );
                              return (
                                <button
                                  key={cs.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSubjectIds((prev) =>
                                      isSelected
                                        ? prev.filter((id) => id !== cs.id)
                                        : [...prev, cs.id],
                                    );
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                                    isSelected
                                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                                      : "bg-white border-gray-100 text-gray-700 hover:border-indigo-300",
                                  )}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-tight">
                                      {Array.isArray(cs.expand?.subject)
                                        ? cs.expand?.subject[0]?.name
                                        : cs.expand?.subject?.name}
                                    </span>
                                    <span
                                      className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest mt-1",
                                        isSelected
                                          ? "text-indigo-100"
                                          : "text-gray-400",
                                      )}
                                    >
                                      {
                                        cs.expand?.course_intake?.expand?.intake
                                          ?.code
                                      }
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <Check size={16} className="text-white" />
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center justify-center bg-gray-50/50 border border-dashed border-gray-200 rounded-2xl text-center">
                          <Search size={32} className="text-gray-300 mb-2" />
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Search to see subjects
                          </p>
                        </div>
                      )}

                      {selectedSubjectIds.length > 0 && (
                        <div className="p-3 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100">
                          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {selectedSubjectIds.length} Selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedSubjectIds([])}
                            className="text-indigo-400 hover:text-indigo-600"
                          >
                            <LucideTrash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-50 flex justify-end">
                      <button
                        type="submit"
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                        Next Step <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="min-w-[500px] space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Session Config */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Assign Lecturer
                          </label>
                          <Select
                            required
                            value={formData.lecturer}
                            onValueChange={(val) =>
                              setFormData({ ...formData, lecturer: val })
                            }
                          >
                            <SelectTrigger className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold h-auto text-sm">
                              <SelectValue placeholder="Select Lecturer" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {lecturers.map((lec) => (
                                <SelectItem
                                  key={lec.id}
                                  value={lec.id}
                                  className="rounded-lg"
                                >
                                  {lec.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl space-y-3">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                            <Hash size={12} /> Selected (
                            {selectedSubjectIds.length})
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {ongoingSubjects
                              .filter((s) => selectedSubjectIds.includes(s.id))
                              .map((s) => (
                                <Badge
                                  key={s.id}
                                  className="bg-white text-indigo-700 border-indigo-100 text-[10px] font-bold px-3 py-1 rounded-xl lowercase tracking-tight shadow-sm"
                                >
                                  {Array.isArray(s.expand?.subject)
                                    ? s.expand?.subject[0]?.name
                                    : s.expand?.subject?.name}
                                </Badge>
                              ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Description
                          </label>
                          <textarea
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all min-h-[120px] resize-none text-sm"
                            placeholder="Overview..."
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      {/* Timing Column */}
                      <div className="flex-1 space-y-4">
                        <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-5">
                          <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                            <Clock size={14} /> Class Timing
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                Date
                              </label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className="w-full flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold text-sm"
                                  >
                                    <CalendarIcon className="h-4 w-4 text-indigo-500" />
                                    {scheduleDate
                                      ? format(scheduleDate, "PPP")
                                      : "Pick a date"}
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-2xl">
                                  <CalendarComponent
                                    mode="single"
                                    selected={scheduleDate}
                                    onSelect={(date) => setScheduleDate(date)}
                                    initialFocus
                                    className="p-3"
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                  Hour
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={scheduleHour}
                                  onChange={(e) =>
                                    setScheduleHour(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl font-bold text-center text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                  Min
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={scheduleMinute}
                                  onChange={(e) =>
                                    setScheduleMinute(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl font-bold text-center text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                  AM/PM
                                </label>
                                <Select
                                  value={scheduleAmPm}
                                  onValueChange={setScheduleAmPm}
                                >
                                  <SelectTrigger className="px-3 py-2 bg-white border border-gray-100 rounded-xl font-bold h-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-gray-100 min-w-[80px]">
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="PM">PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                  Hours
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="12"
                                  value={durationHour}
                                  onChange={(e) =>
                                    setDurationHour(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl font-bold text-center text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                                  Mins
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={durationMinute}
                                  onChange={(e) =>
                                    setDurationMinute(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl font-bold text-center text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="px-6 py-3 bg-gray-50 text-gray-500 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                      >
                        Schedule Class <Play size={14} className="ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Carousel */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <StatsCarousel
          stats={[
            {
              title: "Scheduled",
              value: stats.scheduled,
              icon: Calendar,
              bgColor: "bg-white",
              iconColor: "text-blue-600",
            },
            {
              title: "In Progress",
              value: stats.inProgress,
              icon: Play,
              bgColor: "bg-white",
              iconColor: "text-green-600",
            },
            {
              title: "Completed",
              value: stats.completed,
              icon: CheckCircle,
              bgColor: "bg-white",
              iconColor: "text-gray-600",
            },
            {
              title: "Cancelled",
              value: stats.cancelled,
              icon: XCircle,
              bgColor: "bg-white",
              iconColor: "text-red-600",
            },
          ]}
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <DashboardActionBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search sessions by title..."
          action={
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: "scheduled", label: "SCHEDULED" },
                { id: "completed", label: "HISTORY" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFilter(t.id)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap",
                    filter === t.id
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                      : "text-gray-400 bg-gray-50 hover:bg-gray-100",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          }
        />
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <DashboardLoader
              inline={true}
              message="Syncing Class Schedules..."
            />
          </div>
        ) : (
          <>
            {filteredClasses.map((classItem) => (
              <div
                key={classItem.id}
                className={cn(
                  "group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm transition-all duration-500 flex flex-col gap-6 ring-1 ring-gray-950/[0.02]",
                  classItem.status === "completed"
                    ? "opacity-65 grayscale"
                    : "hover:shadow-xl hover:-translate-y-1",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 overflow-hidden",
                        classItem.status === "in_progress"
                          ? "bg-green-100 text-green-600 animate-pulse ring-4 ring-green-50"
                          : "bg-indigo-50 text-indigo-600",
                      )}
                    >
                      <Video size={24} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <h3
                        className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-2 border-b-2 border-transparent group-hover:border-indigo-100 whitespace-normal"
                        title={classItem.title}
                      >
                        {classItem.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={cn(
                            "px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white border-none",
                            classItem.status === "scheduled"
                              ? "bg-blue-600"
                              : classItem.status === "in_progress"
                                ? "bg-green-600"
                                : classItem.status === "cancelled"
                                  ? "bg-red-600"
                                  : "bg-gray-400",
                          )}
                        >
                          {classItem.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {classItem.status !== "completed" ? (
                      <>
                        <button className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:bg-indigo-600 hover:text-white transition-all duration-500 shadow-sm border-none">
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(classItem.id)}
                          className="p-3 bg-red-50 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all duration-500 shadow-sm border-none"
                          title="End & Archive Session"
                        >
                          <Archive size={18} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleReopenClass(classItem.id)}
                        className="p-3 bg-amber-50 rounded-xl text-amber-500 hover:bg-amber-600 hover:text-white transition-all duration-500 shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-none"
                        title="Reopen Session"
                      >
                        <RotateCcw size={16} /> REOPEN
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-1 border border-transparent group-hover:border-indigo-100/50 transition-all duration-500">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} className="text-indigo-400" /> Date &
                      Time
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {new Date(classItem.start_time).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric" },
                      )}
                      <span className="text-indigo-500 mx-2">•</span>
                      {new Date(classItem.start_time).toLocaleTimeString(
                        "en-US",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl flex flex-col gap-1 border border-transparent group-hover:border-indigo-100/50 transition-all duration-500">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={12} className="text-indigo-400" /> Host
                    </span>
                    <span className="text-sm font-bold text-gray-900 truncate">
                      {classItem.expand?.lecturer?.name || "Administrator"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl">
                      <Clock size={12} />
                      <span className="text-[10px] font-black tracking-widest">
                        {classItem.duration} MIN
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl max-w-[150px]">
                        <Users size={12} />
                        <span className="text-[10px] font-black tracking-widest font-mono truncate">
                          {Array.isArray(classItem.expand?.course_subject)
                            ? (
                                classItem.expand
                                  ?.course_subject as CourseSubject[]
                              )
                                .map(
                                  (cs) =>
                                    cs.expand?.course_intake?.expand?.intake
                                      ?.code,
                                )
                                .filter(Boolean)
                                .join(", ")
                            : (
                                classItem.expand
                                  ?.course_subject as CourseSubject
                              )?.expand?.course_intake?.expand?.intake?.code}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/classroom/${classItem.id}?role=host`,
                        )
                      }
                      className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl transition-all uppercase tracking-widest border-none"
                    >
                      Host <Play size={10} />
                    </button>
                    <button
                      onClick={() =>
                        router.push(
                          `/dashboard/classroom/${classItem.id}?role=attendee`,
                        )
                      }
                      className="flex items-center gap-2 text-[10px] font-black text-gray-500 bg-gray-50 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all uppercase tracking-widest border-none"
                    >
                      View <Eye size={10} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {!loading && filteredClasses.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-200 mx-auto mb-6">
            <Video size={40} />
          </div>
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
            No sessions found
          </h3>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
            Try clearing your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
}
