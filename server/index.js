import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Patients CRUD
app.get('/patients', async (req, res) => {
  const patients = await prisma.patient.findMany();
  res.json(patients);
});

app.post('/patients', async (req, res) => {
  const patient = await prisma.patient.create({ data: req.body });
  res.json(patient);
});

app.get('/patients/:id', async (req, res) => {
  const { id } = req.params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  res.json(patient);
});

// Appointments CRUD
app.get('/appointments', async (req, res) => {
  const appointments = await prisma.appointment.findMany();
  res.json(appointments);
});

app.post('/appointments', async (req, res) => {
  const apt = await prisma.appointment.create({ data: req.body });
  res.json(apt);
});

app.get('/appointments/:id', async (req, res) => {
  const { id } = req.params;
  const apt = await prisma.appointment.findUnique({ where: { id } });
  res.json(apt);
});

// TODO: add endpoints for payments, sessions etc.

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend API listening on http://localhost:${port}`);
});
