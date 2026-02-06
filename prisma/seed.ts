import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@simplyops.com' },
    update: {},
    create: {
      email: 'admin@simplyops.com',
      name: 'Admin User',
      password: hashedPassword,
    },
  })

  // Create sample clients
  const client1 = await prisma.client.create({
    data: {
      name: 'TechCorp Solutions',
      email: 'contact@techcorp.com',
      phone: '+1-555-0123',
      industry: 'Technology',
      status: 'active',
      healthScore: 85,
      createdById: adminUser.id,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Retail Innovations LLC',
      email: 'hello@retailinnovations.com',
      phone: '+1-555-0456',
      industry: 'Retail',
      status: 'active',
      healthScore: 72,
      createdById: adminUser.id,
    },
  })

  // Create contacts
  await prisma.contact.create({
    data: {
      clientId: client1.id,
      name: 'Sarah Johnson',
      email: 'sarah.j@techcorp.com',
      phone: '+1-555-0124',
      role: 'CEO',
      isPrimary: true,
    },
  })

  await prisma.contact.create({
    data: {
      clientId: client2.id,
      name: 'Mike Chen',
      email: 'mike@retailinnovations.com',
      phone: '+1-555-0457',
      role: 'Operations Manager',
      isPrimary: true,
    },
  })

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-commerce Website Redesign',
      description: 'Complete redesign and migration to modern stack',
      type: 'Website Build',
      status: 'in_progress',
      budget: 15000.00,
      startDate: new Date('2024-01-15'),
      dueDate: new Date('2024-03-30'),
      clientId: client1.id,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: 'Lead Automation System',
      description: 'Automated lead capture and qualification system',
      type: 'Automation Build',
      status: 'planning',
      budget: 8500.00,
      startDate: new Date('2024-02-01'),
      dueDate: new Date('2024-04-15'),
      clientId: client2.id,
    },
  })

  // Create tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design mockups and wireframes',
        description: 'Create initial design concepts for client approval',
        status: 'done',
        priority: 'high',
        dueDate: new Date('2024-02-01'),
        projectId: project1.id,
        createdById: adminUser.id,
      },
      {
        title: 'Frontend development',
        description: 'Build responsive frontend components',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date('2024-03-15'),
        projectId: project1.id,
        createdById: adminUser.id,
      },
      {
        title: 'Database design',
        description: 'Design database schema for lead capture',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date('2024-02-15'),
        projectId: project2.id,
        createdById: adminUser.id,
      },
      {
        title: 'Client discovery call',
        description: 'Initial consultation to gather requirements',
        status: 'overdue',
        priority: 'high',
        dueDate: new Date('2024-01-20'),
        clientId: client2.id,
        createdById: adminUser.id,
      },
    ],
  })

  // Create notes
  await prisma.note.createMany({
    data: [
      {
        content: 'Initial client meeting went well. They are excited about the project timeline.',
        type: 'meeting',
        clientId: client1.id,
        projectId: project1.id,
        createdById: adminUser.id,
      },
      {
        content: 'Discussed budget adjustments. Client approved additional $2k for advanced features.',
        type: 'call',
        clientId: client2.id,
        createdById: adminUser.id,
      },
      {
        content: 'Design mockups completed and sent for review.',
        type: 'general',
        projectId: project1.id,
        createdById: adminUser.id,
      },
    ],
  })

  console.log('Database seeded successfully!')
  console.log('Admin user: admin@simplyops.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })