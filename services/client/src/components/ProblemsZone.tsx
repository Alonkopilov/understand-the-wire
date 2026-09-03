import { PROBLEMS } from "../data/problems.ts";
import { Panel, SectionHeading } from "./ui.tsx";

export function ProblemsZone({
  onSelect,
}: {
  onSelect: (nodeId: string) => void;
}) {
  // Unwritten entries are skipped rather than rendered as empty cards, so the
  // section can be filled in one at a time without ever looking broken.
  const written = PROBLEMS.filter((problem) => problem.title.trim() !== "");
  if (written.length === 0) return null;

  return (
    <section className="zone" id="problems">
      <SectionHeading
        eyebrow="04 — What went wrong"
        title="The parts that did not work first time"
        lede="Every one of these were documented on the way to build this project, problems and dilemmas I had to face."
      />

      <div className="problems">
        {written.map((problem) => (
          <Panel className="problem" key={problem.id}>
            <h3>{problem.title}</h3>

            <p className="problem-label">Symptom</p>
            <p>{problem.symptom}</p>

            <p className="problem-label">Cause</p>
            <p>{problem.cause}</p>

            <p className="problem-label">Fix</p>
            <p>{problem.fix}</p>

            {problem.nodeId ? (
              <button
                type="button"
                className="link-button"
                onClick={() => onSelect(problem.nodeId as string)}
              >
                see it on the map
              </button>
            ) : null}
          </Panel>
        ))}
      </div>
    </section>
  );
}
