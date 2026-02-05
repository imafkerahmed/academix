"use client";

import React, { useState } from "react";
import { Download, Ban, FileText, Youtube, Video, Film } from "lucide-react";

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  type: "document" | "youtube-link" | "video-link" | "video-upload";
  filePlaceholder?: string;
  videoUrl?: string;
  canDownload: boolean;
  visible: boolean;
  courseSubjectId: string;
  courseSubjectName: string;
  createdAt: string;
}

interface MaterialsManagerProps {
  initialMaterials: StudyMaterial[];
  availableSubjects: Array<{ id: string; name: string }>;
}

export default function MaterialsManager({
  initialMaterials,
  availableSubjects,
}: MaterialsManagerProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>(initialMaterials);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "document" as StudyMaterial["type"],
    filePlaceholder: "",
    videoUrl: "",
    canDownload: true,
    visible: true,
    courseSubjectId: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "document",
      filePlaceholder: "",
      videoUrl: "",
      canDownload: true,
      visible: true,
      courseSubjectId: "",
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddMaterial = () => {
    if (!formData.title || !formData.courseSubjectId) {
      alert("Please fill in title and select a subject");
      return;
    }

    const selectedSubject = availableSubjects.find(
      (s) => s.id === formData.courseSubjectId,
    );

    const newMaterial: StudyMaterial = {
      id: `material-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      filePlaceholder: formData.filePlaceholder || "file-placeholder.pdf",
      videoUrl: formData.videoUrl,
      canDownload: formData.canDownload,
      visible: formData.visible,
      courseSubjectId: formData.courseSubjectId,
      courseSubjectName: selectedSubject?.name || "Unknown Subject",
      createdAt: new Date().toISOString(),
    };

    setMaterials([newMaterial, ...materials]);
    resetForm();
  };

  const handleEditMaterial = (material: StudyMaterial) => {
    setEditingId(material.id);
    setFormData({
      title: material.title,
      description: material.description,
      type: material.type,
      filePlaceholder: material.filePlaceholder || "",
      videoUrl: material.videoUrl || "",
      canDownload: material.canDownload,
      visible: material.visible,
      courseSubjectId: material.courseSubjectId,
    });
    setShowAddForm(true);
  };

  const handleUpdateMaterial = () => {
    if (!formData.title || !formData.courseSubjectId) {
      alert("Please fill in title and select a subject");
      return;
    }

    const selectedSubject = availableSubjects.find(
      (s) => s.id === formData.courseSubjectId,
    );

    setMaterials(
      materials.map((m) =>
        m.id === editingId
          ? {
              ...m,
              title: formData.title,
              description: formData.description,
              type: formData.type,
              filePlaceholder: formData.filePlaceholder || m.filePlaceholder,
              videoUrl: formData.videoUrl,
              canDownload: formData.canDownload,
              visible: formData.visible,
              courseSubjectId: formData.courseSubjectId,
              courseSubjectName: selectedSubject?.name || m.courseSubjectName,
            }
          : m,
      ),
    );
    resetForm();
  };

  const toggleVisibility = (id: string) => {
    setMaterials(
      materials.map((m) => (m.id === id ? { ...m, visible: !m.visible } : m)),
    );
  };

  const toggleCanDownload = (id: string) => {
    setMaterials(
      materials.map((m) =>
        m.id === id ? { ...m, canDownload: !m.canDownload } : m,
      ),
    );
  };

  const deleteMaterial = (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      setMaterials(materials.filter((m) => m.id !== id));
    }
  };

  const getTypeIcon = (type: StudyMaterial["type"]) => {
    switch (type) {
      case "document":
        return <FileText size={18} className="text-blue-600" />;
      case "youtube-link":
        return <Youtube size={18} className="text-red-600" />;
      case "video-link":
        return <Video size={18} className="text-purple-600" />;
      case "video-upload":
        return <Film size={18} className="text-green-600" />;
      default:
        return <FileText size={18} className="text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Materials</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          aria-label="Add new material"
        >
          {showAddForm ? "Cancel" : "+ Add Material"}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-3">
            {editingId ? "Edit Material" : "Add New Material"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter material title"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Subject *
              </label>
              <select
                value={formData.courseSubjectId}
                onChange={(e) =>
                  setFormData({ ...formData, courseSubjectId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a subject</option>
                {availableSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter material description"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as StudyMaterial["type"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="document">Document</option>
                <option value="youtube-link">YouTube Link</option>
                <option value="video-link">Video Link</option>
                <option value="video-upload">Video Upload</option>
              </select>
            </div>
            {(formData.type === "youtube-link" ||
              formData.type === "video-link") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  value={formData.videoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, videoUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            )}
            {(formData.type === "document" ||
              formData.type === "video-upload") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  File (Placeholder)
                </label>
                <input
                  type="text"
                  value={formData.filePlaceholder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      filePlaceholder: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="file-name.pdf"
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.visible}
                  onChange={(e) =>
                    setFormData({ ...formData, visible: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Visible to Students
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.canDownload}
                  onChange={(e) =>
                    setFormData({ ...formData, canDownload: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Can Download
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={editingId ? handleUpdateMaterial : handleAddMaterial}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              {editingId ? "Update Material" : "Add Material"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-3">
        {materials.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No study materials added yet</p>
          </div>
        ) : (
          materials.map((material) => (
            <div
              key={material.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(material.type)}
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {material.title}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {material.courseSubjectName}
                      </p>
                    </div>
                  </div>
                  {material.description && (
                    <p className="text-sm text-gray-600 mb-2">
                      {material.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-200">
                      {material.type.replace("-", " ").toUpperCase()}
                    </span>
                    {material.filePlaceholder && (
                      <span className="text-gray-500">
                        📎 {material.filePlaceholder}
                      </span>
                    )}
                    {material.videoUrl && (
                      <a
                        href={material.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        🔗 View Link
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleVisibility(material.id)}
                      className={`px-3 py-1 text-xs rounded font-semibold transition ${
                        material.visible
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300"
                      }`}
                      aria-label={`Toggle visibility for ${material.title}`}
                    >
                      {material.visible ? "👁 Visible" : "👁‍🗨 Hidden"}
                    </button>
                    <button
                      onClick={() => toggleCanDownload(material.id)}
                      className={`px-3 py-1 text-xs rounded font-semibold transition flex items-center gap-1 ${
                        material.canDownload
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-700 border border-gray-300"
                      }`}
                      aria-label={`Toggle download for ${material.title}`}
                    >
                      {material.canDownload ? (
                        <>
                          <Download size={14} />
                          Download
                        </>
                      ) : (
                        <>
                          <Ban size={14} />
                          No Download
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMaterial(material)}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 rounded font-semibold hover:bg-yellow-200 transition"
                      aria-label={`Edit ${material.title}`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteMaterial(material.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 border border-red-300 rounded font-semibold hover:bg-red-200 transition"
                      aria-label={`Delete ${material.title}`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
