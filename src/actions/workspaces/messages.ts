'use server'

import { z } from "zod"
import { db } from "@/lib/db/neon"
import { messages, workspaceMembers } from "@/lib/db/schema"
import { requireAuth } from "@/actions/auth/session"
import { eq, and, desc, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const sendMessageSchema = z.object({
  content: z.string().min(1, "Message requis"),
  messageType: z.enum(['text', 'file', 'image', 'audio', 'video']).default('text'),
  threadId: z.string().optional(),
  attachments: z.string().optional(), // JSON string
})

export async function getMessages(workspaceId: string, threadId?: string) {
  try {
    const currentUser = await requireAuth()
    
    // Vérifier l'accès au workspace
    const hasAccess = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, currentUser.id),
          eq(workspaceMembers.userType, currentUser.userType)
        )
      )
      .limit(1)
    
    if (!hasAccess[0] && currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      return {
        success: false,
        error: "Accès non autorisé à ce workspace"
      }
    }
    
    let query = db
      .select({
        id: messages.id,
        content: messages.content,
        messageType: messages.messageType,
        senderId: messages.senderId,
        senderType: messages.senderType,
        threadId: messages.threadId,
        attachments: messages.attachments,
        isEdited: messages.isEdited,
        isDeleted: messages.isDeleted,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
      })
      .from(messages)
      .where(
        and(
          eq(messages.workspaceId, workspaceId),
          eq(messages.isDeleted, false)
        )
      )
    
    // Filtrer par thread si spécifié
    if (threadId) {
      query = query.where(eq(messages.threadId, threadId))
    } else {
      // Messages principaux seulement (pas de réponses)
      query = query.where(isNull(messages.threadId))
    }
    
    const messagesList = await query.orderBy(desc(messages.createdAt))
    
    // Enrichir avec les informations des expéditeurs
    const enrichedMessages = await Promise.all(
      messagesList.map(async (message) => {
        let senderName = 'Utilisateur inconnu'
        
        if (message.senderType === 'employee') {
          const employee = await db.query.employees.findFirst({
            where: eq(employees.id, message.senderId),
            columns: { firstName: true, lastName: true }
          })
          if (employee) {
            senderName = `${employee.firstName} ${employee.lastName}`
          }
        } else if (message.senderType === 'client') {
          const client = await db.query.clients.findFirst({
            where: eq(clients.id, message.senderId),
            columns: { companyName: true }
          })
          if (client) {
            senderName = client.companyName
          }
        }
        
        return {
          ...message,
          senderName,
          attachments: message.attachments ? JSON.parse(message.attachments as string) : []
        }
      })
    )
    
    return {
      success: true,
      data: enrichedMessages
    }
    
  } catch (error) {
    console.error('Error fetching messages:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des messages",
      data: []
    }
  }
}

export async function sendMessage(workspaceId: string, formData: FormData) {
  try {
    const currentUser = await requireAuth()
    
    const data = {
      content: formData.get('content') as string,
      messageType: (formData.get('messageType') as any) || 'text',
      threadId: formData.get('threadId') as string || undefined,
      attachments: formData.get('attachments') as string || undefined,
    }
    
    const validatedData = sendMessageSchema.parse(data)
    
    // Vérifier l'accès au workspace
    const hasAccess = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, currentUser.id),
          eq(workspaceMembers.userType, currentUser.userType)
        )
      )
      .limit(1)
    
    if (!hasAccess[0]) {
      return {
        success: false,
        error: "Vous n'êtes pas membre de ce workspace"
      }
    }
    
    // Créer le message
    const [newMessage] = await db
      .insert(messages)
      .values({
        workspaceId,
        senderId: currentUser.id,
        senderType: currentUser.userType,
        content: validatedData.content,
        messageType: validatedData.messageType,
        threadId: validatedData.threadId,
        attachments: validatedData.attachments ? JSON.parse(validatedData.attachments) : undefined,
      })
      .returning()
    
    revalidatePath(`/workspaces/${workspaceId}`)
    
    return {
      success: true,
      data: newMessage
    }
    
  } catch (error) {
    console.error('Error sending message:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      }
    }
    
    return {
      success: false,
      error: "Erreur lors de l'envoi du message"
    }
  }
}

export async function editMessage(messageId: string, formData: FormData) {
  try {
    const currentUser = await requireAuth()
    
    const content = formData.get('content') as string
    
    if (!content || content.trim().length === 0) {
      return {
        success: false,
        error: "Contenu du message requis"
      }
    }
    
    // Vérifier que l'utilisateur est l'auteur du message
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
    
    if (!message[0]) {
      return {
        success: false,
        error: "Message non trouvé"
      }
    }
    
    if (message[0].senderId !== currentUser.id || message[0].senderType !== currentUser.userType) {
      return {
        success: false,
        error: "Vous ne pouvez modifier que vos propres messages"
      }
    }
    
    // Mettre à jour le message
    await db
      .update(messages)
      .set({
        content: content.trim(),
        isEdited: true,
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId))
    
    revalidatePath(`/workspaces/${message[0].workspaceId}`)
    
    return {
      success: true
    }
    
  } catch (error) {
    console.error('Error editing message:', error)
    return {
      success: false,
      error: "Erreur lors de la modification du message"
    }
  }
}

export async function deleteMessage(messageId: string) {
  try {
    const currentUser = await requireAuth()
    
    // Vérifier que l'utilisateur est l'auteur du message
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
    
    if (!message[0]) {
      return {
        success: false,
        error: "Message non trouvé"
      }
    }
    
    const canDelete = 
      message[0].senderId === currentUser.id && message[0].senderType === currentUser.userType ||
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin'
    
    if (!canDelete) {
      return {
        success: false,
        error: "Permissions insuffisantes pour supprimer ce message"
      }
    }
    
    // Marquer comme supprimé (soft delete)
    await db
      .update(messages)
      .set({
        isDeleted: true,
        content: '[Message supprimé]',
        updatedAt: new Date()
      })
      .where(eq(messages.id, messageId))
    
    revalidatePath(`/workspaces/${message[0].workspaceId}`)
    
    return {
      success: true
    }
    
  } catch (error) {
    console.error('Error deleting message:', error)
    return {
      success: false,
      error: "Erreur lors de la suppression du message"
    }
  }
}

export async function getMessageReplies(messageId: string) {
  try {
    const currentUser = await requireAuth()
    
    // Obtenir le message parent pour vérifier l'accès au workspace
    const parentMessage = await db
      .select({ workspaceId: messages.workspaceId })
      .from(messages)
      .where(eq(messages.id, messageId))
      .limit(1)
    
    if (!parentMessage[0]) {
      return {
        success: false,
        error: "Message non trouvé"
      }
    }
    
    // Vérifier l'accès au workspace
    const hasAccess = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, parentMessage[0].workspaceId),
          eq(workspaceMembers.userId, currentUser.id),
          eq(workspaceMembers.userType, currentUser.userType)
        )
      )
      .limit(1)
    
    if (!hasAccess[0] && currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
      return {
        success: false,
        error: "Accès non autorisé"
      }
    }
    
    // Obtenir les réponses
    const replies = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.threadId, messageId),
          eq(messages.isDeleted, false)
        )
      )
      .orderBy(messages.createdAt)
    
    return {
      success: true,
      data: replies
    }
    
  } catch (error) {
    console.error('Error fetching message replies:', error)
    return {
      success: false,
      error: "Erreur lors de la récupération des réponses",
      data: []
    }
  }
}