"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import pb, { logout } from "@/lib/pocketbase";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCarousel from "@/components/admin/StatsCarousel";
import AdminActionBar from "@/components/admin/AdminActionBar";
import {
  Video,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  Menu,
  Plus,
  ArrowRight,
  Monitor,
  Activity,
  User,
  Hash,
  Trash2,
  ExternalLink,
  Archive,
  RotateCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ZoomClass {
  id: string;
  title: string;
  description?: string;
  zoom_meeting_id?: string;
  galene_group?: string;
  start_time: string;
  duration: number;
  status: string;
  is_recurring: boolean;
  recurrence_day?: string;
  expand?: {
    host?: any;
    zoom_account?: any;
    course_subject?: {
      expand?: {
        subject?: any;
        course_intake?: {
          expand?: {
            course?: any;
            intake?: any;
          };
        };
        lecturer?: any;
      };
    };
  };
}

interface CourseIntake {
  id: string;
  expand?: {
    course?: any;
    intake?: any;
  };
}

interface CourseSubject {
  id: string;
  expand?: {
    subject?: any;
    lecturer?: any;
  };
}

export default function ClassManagement() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ZoomClass[]>([]);
  const [filter, setFilter] = useState<string>("scheduled");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
    fetchCourseIntakes();
  }, [router]);

  const [courseIntakes, setCourseIntakes] = useState<CourseIntake[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<CourseSubject[]>(
    [],
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_intake: "",
    course_subject: "",
  });
  const [durationHour, setDurationHour] = useState<string>("1");
  const [durationMinute, setDurationMinute] = useState<string>("0");
  // Compute nearest hour for default time
  const getNearestHourDefaults = () => {
    const now = new Date();
    let h = now.getHours();
    if (now.getMinutes() > 0) h += 1; // round up
    if (h >= 24) h = 0;
    const amPm = h >= 12 ? "PM" : "AM";
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { hour: String(h12).padStart(2, "0"), amPm };
  };

  const nearestDefaults = getNearestHourDefaults();

  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(
    new Date(),
  );
  const [scheduleHour, setScheduleHour] = useState<string>(
    nearestDefaults.hour,
  );
  const [scheduleMinute, setScheduleMinute] = useState<string>("00");
  const [scheduleAmPm, setScheduleAmPm] = useState<string>(
    nearestDefaults.amPm,
  );

  const fetchCourseIntakes = async () => {
    try {
      const records = await pb.collection("course_intakes").getFullList({
        expand: "course,intake",
      });
      setCourseIntakes(records as any);
    } catch (error) {
      console.error("Error fetching course intakes:", error);
    }
  };

  const fetchSubjectsForIntake = async (courseIntakeId: string) => {
    try {
      const records = await pb.collection("course_subjects").getFullList({
        filter: `course_intake = "${courseIntakeId}"`,
        expand: "subject,lecturer",
      });
      setAvailableSubjects(records as any);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

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

      // Filter out course_intake and format start_time
      const { course_intake, ...submitData } = formData;

      // Generate unique galene_group for each class
      const galeneGroup = `class-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      await pb.collection("classes").create({
        ...submitData,
        duration: totalDuration,
        start_time: finalDate.toISOString(),
        status: "scheduled",
        galene_group: galeneGroup,
      });

      // Automatically create the Galene backend room configuration
      await fetch("/api/galene/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: galeneGroup,
          passwordHost: "lecturer123",
          passwordAttendee: "student123",
          duration: totalDuration || 60,
        }),
      });

      toast.success("Class scheduled successfully!");
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        course_intake: "",
        course_subject: "",
      });
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
      if (error && typeof error === "object" && "response" in error) {
        console.error(
          "PB Validation Error Details:",
          (error as any).response?.data,
        );
      }
      toast.error("Failed to schedule class");
    }
  };

  const handleDeleteClass = async (classId: string, galeneGroup?: string) => {
    if (
      !window.confirm(
        "Are you sure you want to end and archive this session? This will preserve attendance but close the live room.",
      )
    )
      return;
    try {
      // Mark the class as completed in PocketBase
      // We no longer instantly delete the Galene group. It will be cleaned up nightly via a cron job
      // to allow smooth "Reopen" functionality during the day without "group does not exist" errors.
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

  const fetchData = async () => {
    try {
      const records = await pb
        .collection("classes")
        .getFullList({
          sort: "-start_time",
          expand:
            "course_subject.subject,course_subject.course_intake.course,course_subject.course_intake.intake",
        })
        .catch(() => []);

      setClasses((records as any) || []);
      setLoading(false);
    } catch (error) {
      setClasses([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
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

    const matchesFilter =
      filter === "scheduled"
        ? classItem.status === "scheduled" || classItem.status === "in_progress"
        : classItem.status === filter;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-black text-xs uppercase tracking-widest">
            Syncing Class Schedules...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen lg:ml-64 font-sans">
      <main className="p-4 md:p-6 lg:p-8 space-y-8">
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
                {/* Accessibility-only labels */}
                <DialogHeader className="sr-only">
                  <DialogTitle>Schedule New Class</DialogTitle>
                </DialogHeader>

                {/* Visual Header - matches ModernModal */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 uppercase tracking-tight">
                      Schedule New Class
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Setup virtual session parameters
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateClass} className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Left Column: General Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                          Class Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Intro to Data Structures"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                          Course Intake
                        </label>
                        <Select
                          required
                          onValueChange={(val) => {
                            setFormData({
                              ...formData,
                              course_intake: val,
                              course_subject: "",
                            });
                            fetchSubjectsForIntake(val);
                          }}
                        >
                          <SelectTrigger className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold transition-all h-auto">
                            <SelectValue placeholder="Select Intake" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100">
                            {courseIntakes.map((ci) => (
                              <SelectItem
                                key={ci.id}
                                value={ci.id}
                                className="rounded-lg"
                              >
                                {ci.expand?.course?.name} -{" "}
                                {ci.expand?.intake?.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                          Subject
                        </label>
                        <Select
                          required
                          disabled={!formData.course_intake}
                          onValueChange={(val) =>
                            setFormData({ ...formData, course_subject: val })
                          }
                        >
                          <SelectTrigger className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-bold transition-all h-auto">
                            <SelectValue placeholder="Select Subject" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100">
                            {availableSubjects.map((cs) => (
                              <SelectItem
                                key={cs.id}
                                value={cs.id}
                                className="rounded-lg"
                              >
                                {cs.expand?.subject?.[0]?.name ||
                                  cs.expand?.subject?.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                          Description (Optional)
                        </label>
                        <textarea
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold transition-all min-h-[80px] resize-none"
                          placeholder="Brief overview of session topics..."
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

                    {/* Right Column: Timing */}
                    <div className="flex-1 space-y-4">
                      <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-5">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                          <Clock size={14} /> Class Timing
                        </h3>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Date
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "w-full flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold text-sm text-left transition-all hover:bg-gray-50 hover:text-indigo-600",
                                  !scheduleDate && "text-gray-400",
                                )}
                              >
                                <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
                                {scheduleDate ? (
                                  format(scheduleDate, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl"
                              align="start"
                            >
                              <CalendarComponent
                                mode="single"
                                selected={scheduleDate}
                                onSelect={setScheduleDate}
                                initialFocus
                                className="p-3"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Time
                          </label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={scheduleHour}
                              onValueChange={setScheduleHour}
                            >
                              <SelectTrigger className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold transition-all h-auto">
                                <SelectValue placeholder="HH" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100">
                                {Array.from({ length: 12 }).map((_, i) => {
                                  const v = String(i + 1).padStart(2, "0");
                                  return (
                                    <SelectItem
                                      key={v}
                                      value={v}
                                      className="rounded-lg font-bold"
                                    >
                                      {v}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <span className="text-gray-300 font-black text-lg">
                              :
                            </span>
                            <Select
                              value={scheduleMinute}
                              onValueChange={setScheduleMinute}
                            >
                              <SelectTrigger className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold transition-all h-auto">
                                <SelectValue placeholder="MM" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100">
                                {["00", "15", "30", "45"].map((v) => (
                                  <SelectItem
                                    key={v}
                                    value={v}
                                    className="rounded-lg font-bold"
                                  >
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select
                              value={scheduleAmPm}
                              onValueChange={setScheduleAmPm}
                            >
                              <SelectTrigger className="w-[80px] px-3 py-3 bg-indigo-50 border border-indigo-100 rounded-xl font-black text-indigo-600 uppercase tracking-widest transition-all h-auto text-xs">
                                <SelectValue placeholder="AM" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100">
                                <SelectItem
                                  value="AM"
                                  className="rounded-lg font-black uppercase text-xs"
                                >
                                  AM
                                </SelectItem>
                                <SelectItem
                                  value="PM"
                                  className="rounded-lg font-black uppercase text-xs"
                                >
                                  PM
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                            Duration
                          </label>
                          <div className="flex items-center gap-2">
                            <Select
                              value={durationHour}
                              onValueChange={setDurationHour}
                            >
                              <SelectTrigger className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold transition-all h-auto">
                                <SelectValue placeholder="0" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100 max-h-[200px]">
                                {Array.from({ length: 25 }).map((_, i) => (
                                  <SelectItem
                                    key={i}
                                    value={String(i)}
                                    className="rounded-lg font-bold"
                                  >
                                    {i}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">
                              hr
                            </span>
                            <Select
                              value={durationMinute}
                              onValueChange={setDurationMinute}
                            >
                              <SelectTrigger className="flex-1 px-4 py-3 bg-white border border-gray-100 rounded-xl font-bold transition-all h-auto">
                                <SelectValue placeholder="0" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100">
                                <SelectItem
                                  value="0"
                                  className="rounded-lg font-bold"
                                >
                                  0
                                </SelectItem>
                                <SelectItem
                                  value="15"
                                  className="rounded-lg font-bold"
                                >
                                  15
                                </SelectItem>
                                <SelectItem
                                  value="30"
                                  className="rounded-lg font-bold"
                                >
                                  30
                                </SelectItem>
                                <SelectItem
                                  value="45"
                                  className="rounded-lg font-bold"
                                >
                                  45
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">
                              min
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-6 border-t border-gray-50">
                    <button
                      type="submit"
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest"
                    >
                      SCHEDULE SESSION
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-full py-2 rounded-xl font-bold text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-wider"
                    >
                      CANCEL
                    </button>
                  </div>
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
                bgColor: "bg-blue-50",
                iconColor: "text-blue-600",
              },
              {
                title: "In Progress",
                value: stats.inProgress,
                icon: Play,
                bgColor: "bg-green-50",
                iconColor: "text-green-600",
              },
              {
                title: "Completed",
                value: stats.completed,
                icon: CheckCircle,
                bgColor: "bg-gray-100",
                iconColor: "text-gray-600",
              },
              {
                title: "Cancelled",
                value: stats.cancelled,
                icon: XCircle,
                bgColor: "bg-red-50",
                iconColor: "text-red-600",
              },
            ]}
          />
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminActionBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search sessions by title..."
            action={
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: "scheduled", label: "SCHEDULED", color: "blue" },
                  { id: "completed", label: "HISTORY", color: "gray" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap ${
                      filter === t.id
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                        : "text-gray-400 bg-gray-50 hover:bg-gray-100"
                    }`}
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
          {filteredClasses.map((classItem) => (
            <div
              key={classItem.id}
              className={`group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm transition-all duration-500 flex flex-col gap-6 ring-1 ring-gray-950/[0.02] ${
                classItem.status === "completed"
                  ? "opacity-65 grayscale"
                  : "hover:shadow-xl hover:-translate-y-1"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-500 overflow-hidden ${
                      classItem.status === "in_progress"
                        ? "bg-green-100 text-green-600 animate-pulse ring-4 ring-green-50"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    <Video size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                      {classItem.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          classItem.status === "scheduled"
                            ? "bg-blue-600"
                            : classItem.status === "in_progress"
                              ? "bg-green-600"
                              : classItem.status === "cancelled"
                                ? "bg-red-600"
                                : "bg-gray-400"
                        } text-white`}
                      >
                        {classItem.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {classItem.status !== "completed" ? (
                    <>
                      <button className="p-3 bg-gray-50 rounded-xl text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteClass(
                            classItem.id,
                            classItem.galene_group,
                          )
                        }
                        className="p-3 bg-red-50 rounded-xl text-red-500 hover:bg-red-600 hover:text-white transition-all duration-500 shadow-sm"
                        title="End & Archive Session"
                      >
                        <Archive size={18} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleReopenClass(classItem.id)}
                      className="p-3 bg-amber-50 rounded-xl text-amber-500 hover:bg-amber-600 hover:text-white transition-all duration-500 shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                      title="Reopen Session"
                    >
                      <RotateCcw size={16} /> Reopen
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
                    {classItem.expand?.course_subject?.expand?.lecturer?.name ||
                      "Administrator"}
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
                  <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl">
                    <Users size={12} />
                    <span className="text-[10px] font-black tracking-widest font-mono">
                      {
                        classItem.expand?.course_subject?.expand?.course_intake
                          ?.expand?.intake?.code
                      }
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/classroom/${classItem.id}?role=host`,
                      )
                    }
                    className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
                  >
                    Host <Play size={10} />
                  </button>
                  <button
                    onClick={() =>
                      router.push(
                        `/dashboard/classroom/${classItem.id}?role=attendee`,
                      )
                    }
                    className="flex items-center gap-2 text-[10px] font-black text-gray-500 bg-gray-50 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
                  >
                    View <Eye size={10} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredClasses.length === 0 && (
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
      </main>
    </div>
  );
}
