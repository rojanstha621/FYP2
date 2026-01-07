import { useState, useEffect } from 'react';
import { Card, Button } from '../components/FormElements';
import { Chart } from '../components/Chart';

export const ProgressPage = () => {
  const [progressData, setProgressData] = useState([
    { date: '2024-01-15', completed: 3, painLevel: 6, difficulty: 5 },
    { date: '2024-01-16', completed: 2, painLevel: 5, difficulty: 4 },
    { date: '2024-01-17', completed: 3, painLevel: 4, difficulty: 5 },
    { date: '2024-01-18', completed: 1, painLevel: 7, difficulty: 7 },
    { date: '2024-01-19', completed: 4, painLevel: 3, difficulty: 3 },
    { date: '2024-01-20', completed: 3, painLevel: 4, difficulty: 4 },
    { date: '2024-01-21', completed: 2, painLevel: 5, difficulty: 5 },
  ]);

  const stats = {
    totalExercises: progressData.reduce((sum, day) => sum + day.completed, 0),
    avgPainLevel: (progressData.reduce((sum, day) => sum + day.painLevel, 0) / progressData.length).toFixed(1),
    avgDifficulty: (progressData.reduce((sum, day) => sum + day.difficulty, 0) / progressData.length).toFixed(1),
    consistencyDays: progressData.filter(d => d.completed > 0).length,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-palette-dark mb-8">My Progress</h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card>
          <h3 className="text-palette-dark/70 text-sm font-semibold mb-2">Total Exercises</h3>
          <p className="text-4xl font-bold text-palette-mauve">{stats.totalExercises}</p>
        </Card>

        <Card>
          <h3 className="text-palette-dark/70 text-sm font-semibold mb-2">Avg Pain Level</h3>
          <p className="text-4xl font-bold text-palette-blush">{stats.avgPainLevel}/10</p>
        </Card>

        <Card>
          <h3 className="text-palette-dark/70 text-sm font-semibold mb-2">Avg Difficulty</h3>
          <p className="text-4xl font-bold text-palette-mauve">{stats.avgDifficulty}/10</p>
        </Card>

        <Card>
          <h3 className="text-palette-dark/70 text-sm font-semibold mb-2">Consistency</h3>
          <p className="text-4xl font-bold text-palette-blush">{stats.consistencyDays} days</p>
        </Card>
      </div>

      <Card className="mb-8">
        <h2 className="text-2xl font-bold text-palette-dark mb-6">Weekly Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-palette-cream/40">
                <th className="text-left py-3 px-4 text-palette-dark/80 font-semibold">Date</th>
                <th className="text-left py-3 px-4 text-palette-dark/80 font-semibold">Exercises</th>
                <th className="text-left py-3 px-4 text-palette-dark/80 font-semibold">Pain Level</th>
                <th className="text-left py-3 px-4 text-palette-dark/80 font-semibold">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {progressData.map((day) => (
                <tr key={day.date} className="border-b border-palette-cream/30 hover:bg-palette-cream/95">
                  <td className="py-3 px-4 text-palette-dark">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-3 py-1 bg-palette-cream text-palette-dark rounded-full text-sm">
                      {day.completed} exercises
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-palette-cream/50 rounded-full h-2">
                        <div
                          className="bg-palette-blush h-2 rounded-full"
                          style={{ width: `${day.painLevel * 10}%` }}
                        />
                      </div>
                      <span className="text-sm text-palette-dark/70">{day.painLevel}/10</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-palette-cream/50 rounded-full h-2">
                        <div
                          className="bg-palette-mauve h-2 rounded-full"
                          style={{ width: `${day.difficulty * 10}%` }}
                        />
                      </div>
                      <span className="text-sm text-palette-dark/70">{day.difficulty}/10</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-palette-dark mb-6">Trend Analysis</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-palette-dark mb-4">Pain Level Trend</h3>
            <div className="space-y-2">
              {progressData.slice(-7).map((day, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm text-palette-dark/60 w-16">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <div className="flex-1 bg-palette-cream/50 rounded-full h-3">
                    <div
                      className="bg-palette-blush h-3 rounded-full transition-all"
                      style={{ width: `${day.painLevel * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-palette-dark/75 w-8">{day.painLevel}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-palette-dark mb-4">Difficulty Trend</h3>
            <div className="space-y-2">
              {progressData.slice(-7).map((day, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm text-palette-dark/60 w-16">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <div className="flex-1 bg-palette-cream/50 rounded-full h-3">
                    <div
                      className="bg-palette-mauve h-3 rounded-full transition-all"
                      style={{ width: `${day.difficulty * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-palette-dark/75 w-8">{day.difficulty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
