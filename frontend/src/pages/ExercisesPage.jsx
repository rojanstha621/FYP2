import { useState } from 'react';
import { Card, Button, Input } from '../components/FormElements';

const SAMPLE_EXERCISES = [
  {
    id: 1,
    name: 'Leg Raises',
    videoUrl: 'https://www.youtube.com/embed/jRJliFLgJ5k',
    sets: 3,
    reps: 15,
    duration: '5 min',
    difficulty: 'Medium',
    description: 'Lie on your back and raise your legs slowly.',
  },
  {
    id: 2,
    name: 'Arm Circles',
    videoUrl: 'https://www.youtube.com/embed/P_PpUyZFz5s',
    sets: 3,
    reps: 20,
    duration: '3 min',
    difficulty: 'Easy',
    description: 'Stand with arms extended and make circular motions.',
  },
  {
    id: 3,
    name: 'Squats',
    videoUrl: 'https://www.youtube.com/embed/QOVaHwm-Q6U',
    sets: 3,
    reps: 12,
    duration: '5 min',
    difficulty: 'Hard',
    description: 'Stand with feet shoulder-width apart and lower your body.',
  },
];

export const ExercisesPage = () => {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [startedExercises, setStartedExercises] = useState({});
  const [painLevel, setPainLevel] = useState(5);
  const [difficulty, setDifficulty] = useState(5);

  const handleStartExercise = (exercise) => {
    setSelectedExercise(exercise);
    setPainLevel(5);
    setDifficulty(5);
  };

  const handleCompleteExercise = () => {
    if (selectedExercise) {
      setStartedExercises({
        ...startedExercises,
        [selectedExercise.id]: {
          completed: true,
          painLevel,
          difficulty,
          date: new Date().toLocaleDateString(),
        },
      });
      setSelectedExercise(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-palette-dark mb-8">My Exercises</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {SAMPLE_EXERCISES.map((exercise) => (
          <Card key={exercise.id}>
            <h3 className="text-xl font-bold text-palette-dark mb-2">{exercise.name}</h3>
            <p className="text-palette-dark/70 text-sm mb-4">{exercise.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-palette-dark/70">Sets:</span>
                <span className="font-bold">{exercise.sets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-palette-dark/70">Reps:</span>
                <span className="font-bold">{exercise.reps}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-palette-dark/70">Duration:</span>
                <span className="font-bold">{exercise.duration}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-palette-dark/70">Difficulty:</span>
                <span className={`font-bold ${
                  exercise.difficulty === 'Easy' ? 'text-palette-blush' :
                  exercise.difficulty === 'Medium' ? 'text-palette-mauve' :
                  'text-palette-dark'
                }`}>
                  {exercise.difficulty}
                </span>
              </div>
            </div>

            {startedExercises[exercise.id]?.completed && (
              <div className="mb-4 p-3 bg-palette-blush/20 rounded-lg">
                <p className="text-sm text-palette-blush font-semibold">Completed</p>
                <p className="text-xs text-palette-blush/80">
                  {startedExercises[exercise.id].date}
                </p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleStartExercise(exercise)}
            >
              {startedExercises[exercise.id]?.completed ? 'Redo' : 'Start'}
            </Button>
          </Card>
        ))}
      </div>

      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedExercise(null)}
              className="float-right text-2xl font-bold text-palette-dark/60 hover:text-palette-dark"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-palette-dark mb-4 clear-right">
              {selectedExercise.name}
            </h2>

            <div className="aspect-video bg-black rounded-lg mb-6 overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={selectedExercise.videoUrl}
                title={selectedExercise.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <label className="block font-semibold text-palette-dark mb-2">
                  Pain Level: {painLevel}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-palette-dark/50 mt-1">
                  <span>No Pain</span>
                  <span>Severe Pain</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-palette-dark mb-2">
                  Difficulty Level: {difficulty}/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-palette-dark/50 mt-1">
                  <span>Very Easy</span>
                  <span>Extremely Hard</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-palette-dark/60">Sets: <span className="font-bold">{selectedExercise.sets}</span></p>
                </div>
                <div>
                  <p className="text-palette-dark/60">Reps: <span className="font-bold">{selectedExercise.reps}</span></p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="primary" className="flex-1" onClick={handleCompleteExercise}>
                Mark as Complete
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedExercise(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
