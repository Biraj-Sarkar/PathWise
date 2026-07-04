// DownloadRoadmap.tsx

type Roadmap = {
  step: number;
  title: string;
  description: string;
};

type Props = {
  topic: string;
  level: string;
  roadmap: Roadmap[];
  revisionTopics: string[];
  nextTopics: string[];
};

export default function DownloadRoadmap({
  topic,
  level,
  roadmap,
  revisionTopics,
  nextTopics,
}: Props) {
  return (
    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 w-200">
      {level && (
        <div className="mb-8 flex items-center justify-between">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2">
            <span className="block text-[9px] font-bold uppercase text-gray-400">
              Current Level
            </span>
            <span className="text-xs font-bold text-blue-600 capitalize">
              {level}
            </span>
          </div>

          <span className="text-xs font-bold text-gray-500">
            Viewing:{" "}
            <span className="text-gray-800 capitalize">{topic}</span>
          </span>
        </div>
      )}

      <div className="relative pl-8 border-l-2 border-dashed border-gray-200 flex flex-col gap-8 ml-4">
        {roadmap
          .sort((a, b) => a.step - b.step)
          .map((stepItem) => (
            <div key={stepItem.step} className="relative">
              <div className="absolute -left-10 top-1.5 w-4 h-4 bg-blue-600 border-4 border-white rounded-full" />

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                    Step {stepItem.step}
                  </span>

                  <h3 className="text-sm font-bold">
                    {stepItem.title}
                  </h3>
                </div>

                <p className="text-xs text-gray-500">
                  {stepItem.description}
                </p>
              </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t border-gray-200">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-amber-800 mb-3">
            Revision Topics
          </h3>

          <ul className="space-y-2">
            {revisionTopics.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <h3 className="text-xs font-bold text-emerald-800 mb-3">
            Next Topics
          </h3>

          <ul className="space-y-2">
            {nextTopics.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}