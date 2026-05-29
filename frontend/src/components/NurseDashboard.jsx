import React, { useEffect, useMemo, useState } from 'react';
import { assignmentAPI, nurseAPI, nursingNotesAPI } from '../services/api';
import { Card, Button, Select, Textarea } from './FormElements';

export default function NurseDashboard(){
  const [appointments, setAppointments] = useState([]);
  const [nurseAssignments, setNurseAssignments] = useState([]);
  const [therapistAssignments, setTherapistAssignments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [noteText, setNoteText] = useState('');

  useEffect(()=>{ fetchDashboardData(); },[]);

  const extractList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.data?.results)) return payload.data.results;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result)) return payload.result;
    return [];
  };

  const getEntityId = (entity) => String(entity?.id || entity || '');
  const getPatientId = (assignment) => String(assignment?.patient?.id || assignment?.patient || '');
  const getTherapistName = (assignment) => {
    const therapist = assignment?.therapist_details || assignment?.therapist;
    const fullName = `${therapist?.first_name || ''} ${therapist?.last_name || ''}`.trim();
    return fullName || therapist?.email || 'No therapist assigned yet';
  };

  async function fetchDashboardData(){
    try{
      const [appointmentsRes, nurseAssignmentsRes, therapistAssignmentsRes, directoryRes] = await Promise.all([
        nurseAPI.getAppointments(),
        nurseAPI.getAssignments(),
        assignmentAPI.getAssignments(),
        nurseAPI.getDirectory(),
      ]);

      setAppointments(extractList(appointmentsRes.data || appointmentsRes));
      setNurseAssignments(extractList(nurseAssignmentsRes.data || nurseAssignmentsRes).filter((assignment) => assignment.is_active !== false));
      setTherapistAssignments(extractList(therapistAssignmentsRes.data || therapistAssignmentsRes).filter((assignment) => assignment.is_active !== false));
      const directory = directoryRes.data?.result || directoryRes.data || {};
      setPatients(Array.isArray(directory?.patients) ? directory.patients : []);
    }catch(e){ console.error(e); }
  }

  const assignmentRows = useMemo(() => therapistAssignments.map((assignment) => ({
    id: assignment.id,
    patientName: `${assignment.patient_details?.first_name || ''} ${assignment.patient_details?.last_name || ''}`.trim() || assignment.patient_details?.email || 'Unknown patient',
    therapistName: getTherapistName(assignment),
    assignedAt: assignment.assigned_at,
  })), [therapistAssignments]);

  const therapistAssignedPatients = useMemo(() => {
    const assignedIds = new Set(nurseAssignments.map((assignment) => getPatientId(assignment)));
    return patients.filter((patient) => assignedIds.has(patient.id));
  }, [patients, nurseAssignments]);

  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter((appointment) => {
      if (appointment?.status === 'CANCELLED') return false;
      if (!appointment?.scheduled_for) return true;
      return new Date(appointment.scheduled_for) >= now;
    });
  }, [appointments]);

  async function handleCheckIn(id){
    try{ await nurseAPI.checkInAppointment(id); fetchDashboardData(); }catch(e){console.error(e)}
  }

  async function handleAssignDoctor(id){
    const doctorId = prompt('Enter doctor id to assign:');
    if(!doctorId) return;
    try{ await nurseAPI.assignDoctor(id, doctorId); fetchDashboardData(); }catch(e){console.error(e)}
  }

  async function submitNote(e){
    e.preventDefault();
    if(!patientId) return alert('Patient required');
    try{
      await nursingNotesAPI.createNote({ patient: patientId, note_type: 'FOLLOW_UP', text: noteText });
      setNoteText('');
      alert('Note created');
    }catch(e){ console.error(e); }
  }

  return (
    <div className="space-y-6 p-4">
      <Card>
        <h2 className="text-xl font-bold">Nurse Dashboard</h2>
        <p className="mt-1 text-sm text-palette-dark/70">Quick access to appointments, vitals, notes, and patient-to-therapist links.</p>
      </Card>

      <Card>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Patient / Therapist Assignments</h3>
            <p className="text-sm text-palette-dark/60">See which therapist is attached to each patient before creating appointments.</p>
          </div>
          <div className="text-sm text-palette-dark/60">{assignmentRows.length} active links</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-palette-dark/55">
              <tr>
                <th className="py-2 pr-4">Patient</th>
                <th className="py-2 pr-4">Therapist</th>
                <th className="py-2 pr-4">Assigned At</th>
              </tr>
            </thead>
            <tbody>
              {assignmentRows.map((row) => (
                <tr key={row.id} className="border-t border-palette-cream/50">
                  <td className="py-3 pr-4 font-medium text-palette-dark">{row.patientName}</td>
                  <td className="py-3 pr-4 text-palette-dark/80">{row.therapistName}</td>
                  <td className="py-3 pr-4 text-palette-dark/60">{row.assignedAt ? new Date(row.assignedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {assignmentRows.length === 0 && (
                <tr>
                  <td colSpan="3" className="py-4 text-palette-dark/60">No therapist assignments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold">Upcoming Appointments</h3>
        <ul className="mt-3">
          {upcomingAppointments.map((a)=> (
            <li key={a.id} className="py-2 border-b">
              <div>
                {a.title} — {a.scheduled_for} — {a.patient_details?.first_name} {a.patient_details?.last_name}
              </div>
              <div className="text-sm text-palette-dark/60">
                {a.therapist_details ? `${a.therapist_details.first_name} ${a.therapist_details.last_name}` : 'No therapist assigned yet'}
              </div>
              <div className="space-x-2 mt-1">
                <button onClick={()=>handleCheckIn(a.id)} className="btn">Check-in</button>
                <button onClick={()=>handleAssignDoctor(a.id)} className="btn">Assign doctor</button>
              </div>
            </li>
          ))}
          {upcomingAppointments.length === 0 && (
            <li className="py-2 text-sm text-palette-dark/60">No upcoming appointments.</li>
          )}
        </ul>
      </Card>

      <Card>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-palette-dark/45">Follow-up notes</p>
            <h3 className="mt-2 text-xl font-bold text-palette-dark">Add a follow-up note</h3>
            <p className="mt-2 text-sm text-palette-dark/70">Log follow-up comments for a patient using the same card style as the rest of the dashboard.</p>
          </div>
        </div>

        <form onSubmit={submitNote} className="mt-6 grid gap-4 md:grid-cols-2">
          <Select
            label="Patient Email"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">Select a patient</option>
            {therapistAssignedPatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.email}
              </option>
            ))}
          </Select>
          <div className="md:col-span-2">
            <Textarea
              label="Follow-up Note"
              placeholder="Write the follow-up note here"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" variant="primary">
              Add Note
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
