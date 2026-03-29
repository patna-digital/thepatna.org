"use client";

import { useState } from "react";

function createEmptyProject() {
  return {
    id: `project-${Math.random().toString(36).slice(2, 10)}`,
    title: "",
    link: "",
  };
}

export function RelevantProjectsFields({ initialProjects = [] }) {
  const [projects, setProjects] = useState(
    initialProjects.length
      ? initialProjects.map((project, index) => ({
          id: `project-${index}-${Math.random().toString(36).slice(2, 10)}`,
          title: project.title || "",
          link: project.link || "",
        }))
      : [createEmptyProject()],
  );

  function updateProject(index, field, value) {
    setProjects((current) =>
      current.map((project, projectIndex) =>
        projectIndex === index ? { ...project, [field]: value } : project,
      ),
    );
  }

  function addProject() {
    setProjects((current) => [...current, createEmptyProject()]);
  }

  function removeProject(index) {
    setProjects((current) => {
      const next = current.filter((_, projectIndex) => projectIndex !== index);
      return next.length ? next : [createEmptyProject()];
    });
  }

  function moveProject(index, direction) {
    setProjects((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(nextIndex, 0, item);
      return next;
    });
  }

  return (
    <div className="project-entry-list">
      {projects.map((project, index) => (
        <div className="project-entry-card" key={project.id}>
          <div className="project-entry-grid">
            <label>
              Project title
              <input
                name="relevant_project_title"
                onChange={(event) => updateProject(index, "title", event.target.value)}
                placeholder="Project, brief, publication, or campaign title"
                type="text"
                value={project.title}
              />
            </label>
            <label>
              Project link
              <input
                name="relevant_project_link"
                onChange={(event) => updateProject(index, "link", event.target.value)}
                placeholder="https://..."
                type="text"
                value={project.link}
              />
            </label>
          </div>
          <div className="project-entry-actions">
            <button className="secondary-button" onClick={() => moveProject(index, -1)} type="button">
              Move up
            </button>
            <button className="secondary-button" onClick={() => moveProject(index, 1)} type="button">
              Move down
            </button>
            <button className="secondary-button" onClick={() => removeProject(index)} type="button">
              Remove
            </button>
          </div>
        </div>
      ))}

      <button className="secondary-button" onClick={addProject} type="button">
        Add another project
      </button>
    </div>
  );
}
