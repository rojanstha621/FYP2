import { Link } from 'react-router-dom';
import { Card, Button } from '../components/FormElements';
import { useAuth } from '../hooks/useAuth';
import NurseDashboard from '../components/NurseDashboard';

export const NurseDashboardPage = () => {
  const { user } = useAuth();

  const cards = [
    {
      to: '/nurse/patients',
      title: 'Patients & Medical Histories',
      description: 'Assign patients to your care and upload or update their medical histories.',
    },
    {
      to: '/nurse/appointments',
      title: 'Appointments',
      description: 'Schedule check-ins, follow-ups, and joint sessions with therapists.',
    },
  ];

  const highlights = [
    { label: 'Patients', value: 'Assigned care' },
    { label: 'Histories', value: 'Updated by nurses' },
    { label: 'Appointments', value: 'Scheduled workflows' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fade-in-up">
      <section className="glass-panel rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-palette-dark/60 backdrop-blur-xl">
            Nurse workspace
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-palette-dark">
              Nurse Dashboard
            </h1>
            <p className="mt-2 text-palette-dark/70 max-w-2xl">
              Manage patient links, medical histories, and appointments from one coordinated view.
            </p>
          </div>
          <p className="text-sm text-palette-dark/60">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}. Your care tasks are organized below.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-4 md:p-5 min-w-[240px] border border-palette-mauve/15">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-palette-dark/50">Today</p>
          <div className="mt-3 space-y-3">
            {highlights.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-palette-dark/70">{item.label}</span>
                <span className="text-sm font-semibold text-palette-dark">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        {highlights.map((item, index) => (
          <Card key={item.label} className="animate-fade-in-up" style={{ animationDelay: `${index * 90}ms` }}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-palette-dark/45">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-palette-dark">{item.value}</p>
          </Card>
        ))}
      </div>

      <section className="mt-8">
        <NurseDashboard />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card.to} className="group h-full border border-white/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-palette-dark/45">Care flow</p>
                <h2 className="mt-3 text-2xl font-bold text-palette-dark">{card.title}</h2>
                <p className="mt-3 text-palette-dark/70 leading-relaxed">{card.description}</p>
              </div>

              <div className="mt-6">
                <Link to={card.to}>
                  <Button variant="primary" className="w-full group-hover:-translate-y-0.5">
                    Open
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
