'use server'

import { db } from "@/lib/db/neon"
import { projects, clients, departments, employees } from "@/lib/db/schema"
import { eq, and, or } from "drizzle-orm"
import { requireAuth } from "@/actions/auth/session"

export async function getProjects() {
  try {
    const currentUser = await requireAuth()
    
    let query = db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        createdAt: projects.createdAt,
        clientName: clients.companyName,
        clientEmail: clients.contactEmail,
        departmentName: departments.name,
        managerName: employees.firstName,
        managerLastName: employees.lastName,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(departments, eq(projects.departmentId, departments.id))
      .leftJoin(employees, eq(projects.managerId, employees.id))
    
    // Filtrer selon le rôle de l'utilisateur
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      // Admin voit tous les projets
    } else if (currentUser.role === 'dept_manager') {
      // Manager voit les projets de son département
      query = query.where(eq(projects.departmentId, currentUser.departmentId!))
    } else if (currentUser.role === 'employee') {
      // Employé voit les projets de son département
      query = query.where(eq(projects.departmentId, currentUser.departmentId!))
    } else if (currentUser.role === 'client') {
      // Client voit seulement ses projets
      query = query.where(eq(projects.clientId, currentUser.id))
    }
    
    const projectsList = await query
    
    const formattedProjects = projectsList.map(project => ({
      ...project,
      managerFullName: project.managerName 
        ? `${project.managerName} ${project.managerLastName || ''}`.trim()
        : null
    }))
    
    return {
      success: true,
      data: formattedProjects
    }
    
  } catch (error) {
    console.error('Error fetching projects:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des projets",
      data: []
    }
  }
}

export async function getProjectById(id: string) {
  try {
    const currentUser = await requireAuth()
    
    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        clientId: projects.clientId,
        departmentId: projects.departmentId,
        managerId: projects.managerId,
        createdAt: projects.createdAt,
        clientName: clients.companyName,
        clientEmail: clients.contactEmail,
        departmentName: departments.name,
        managerName: employees.firstName,
        managerLastName: employees.lastName,
      })
      .from(projects)
      .leftJoin(clients, eq(projects.clientId, clients.id))
      .leftJoin(departments, eq(projects.departmentId, departments.id))
      .leftJoin(employees, eq(projects.managerId, employees.id))
      .where(eq(projects.id, id))
      .limit(1)
    
    if (!project) {
      return {
        success: false,
        error: "Projet non trouvé"
      }
    }
    
    // Vérifier les permissions d'accès
    const canAccess = 
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin' ||
      (currentUser.role === 'dept_manager' && project.departmentId === currentUser.departmentId) ||
      (currentUser.role === 'employee' && project.departmentId === currentUser.departmentId) ||
      (currentUser.role === 'client' && project.clientId === currentUser.id) ||
      project.managerId === currentUser.id
    
    if (!canAccess) {
      return {
        success: false,
        error: "Accès non autorisé à ce projet"
      }
    }
    
    return {
      success: true,
      data: {
        ...project,
        managerFullName: project.managerName 
          ? `${project.managerName} ${project.managerLastName || ''}`.trim()
          : null
      }
    }
    
  } catch (error) {
    console.error('Error fetching project:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération du projet"
    }
  }
}

export async function getProjectsByDepartment(departmentId: string) {
  try {
    const currentUser = await requireAuth()
    
    // Vérifier les permissions
    if (
      currentUser.role !== 'super_admin' &&
      currentUser.role !== 'admin' &&
      currentUser.departmentId !== departmentId
    ) {
      return {
        success: false,
        error: "Accès non autorisé",
        data: []
      }
    }
    
    const projectsList = await db
      .select()
      .from(projects)
      .where(eq(projects.departmentId, departmentId))
    
    return {
      success: true,
      data: projectsList
    }
    
  } catch (error) {
    console.error('Error fetching projects by department:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des projets",
      data: []
    }
  }
}

export async function getProjectsByClient(clientId: string) {
  try {
    const currentUser = await requireAuth()
    
    // Seuls les admins ou le client lui-même peuvent voir ses projets
    if (
      currentUser.role !== 'super_admin' &&
      currentUser.role !== 'admin' &&
      currentUser.id !== clientId
    ) {
      return {
        success: false,
        error: "Accès non autorisé",
        data: []
      }
    }
    
    const projectsList = await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, clientId))
    
    return {
      success: true,
      data: projectsList
    }
    
  } catch (error) {
    console.error('Error fetching projects by client:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des projets",
      data: []
    }
  }
}