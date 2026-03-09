import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { PIPELINE_STAGES } from '@/lib/pipeline'
import { toast } from 'sonner'
import { Client } from './types'

export function useStageClients(stageId: number) {
    const supabase = useMemo(() => createClient(), [])
    const stage = useMemo(() => PIPELINE_STAGES.find(s => s.id === stageId), [stageId])
    const nextStage = useMemo(() => PIPELINE_STAGES.find(s => s.id === stageId + 1), [stageId])

    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', website: '', deal_value: '' })

    const fetchClients = useCallback(async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('clients')
            .select('id, name, company, email, phone, website, stage, deal_value, pipeline_status, stage_notes, updated_at, created_at')
            .eq('stage', stageId)
            .order('updated_at', { ascending: false })

        if (error) toast.error('Failed to load clients')
        else setClients(data || [])
        setLoading(false)
    }, [stageId, supabase])

    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) {
            toast.error('Client name is required')
            return
        }
        setSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', user.id)
                .single()

            const { error } = await supabase.from('clients').insert({
                name: form.name.trim(),
                company: form.company.trim() || null,
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                website: form.website.trim() || null,
                deal_value: Math.round(parseFloat(form.deal_value) || 0),
                stage: stageId,
                workspace_id: profile?.workspace_id,
                pipeline_status: 'new',
            })

            if (error) throw error
            toast.success(`${form.name} added to ${stage?.name}`)
            setForm({ name: '', company: '', email: '', phone: '', website: '', deal_value: '' })
            fetchClients()
            return true
        } catch (err: any) {
            toast.error(err.message)
            return false
        } finally {
            setSubmitting(false)
        }
    }

    const updateStatus = useCallback(async (clientId: string, status: string) => {
        const { error } = await supabase
            .from('clients')
            .update({ pipeline_status: status })
            .eq('id', clientId)

        if (error) { toast.error('Failed to update status'); return }
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, pipeline_status: status } : c))
        toast.success('Status updated')
    }, [supabase])

    const transferClient = useCallback(async (client: Client, newStageId: number) => {
        if (client.stage === newStageId) return
        const nStage = PIPELINE_STAGES.find(s => s.id === newStageId)
        if (!nStage) return

        const { error } = await supabase
            .from('clients')
            .update({ stage: newStageId, pipeline_status: 'new' })
            .eq('id', client.id)

        if (error) { toast.error('Failed to transfer client'); return }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', user.id)
                .single()
            await supabase.from('activity_log').insert({
                client_id: client.id,
                action_type: 'stage_change',
                description: `Transferred from ${stage?.name} to ${nStage.name}`,
                workspace_id: profile?.workspace_id,
            })
        }

        toast.success(`${client.name} moved to ${nStage.name}!`)
        fetchClients()
    }, [stage?.name, supabase, fetchClients])

    const handleDeleteClient = async (clientId: string, clientName: string) => {
        setSubmitting(true)
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId)

        if (error) {
            toast.error('Failed to delete client')
            setSubmitting(false)
            return false
        } else {
            toast.success(`${clientName} removed from pipeline`)
            setClients(prev => prev.filter(c => c.id !== clientId))
            setSubmitting(false)
            return true
        }
    }

    const saveNote = async (clientId: string, noteText: string) => {
        setSubmitting(true)
        const { error } = await supabase
            .from('clients')
            .update({ stage_notes: noteText })
            .eq('id', clientId)

        if (error) {
            toast.error('Failed to save note')
            setSubmitting(false)
            return false
        } else {
            toast.success('Note saved')
            setClients(prev => prev.map(c => c.id === clientId ? { ...c, stage_notes: noteText } : c))
            setSubmitting(false)
            return true
        }
    }

    return {
        stage,
        nextStage,
        clients,
        loading,
        submitting,
        form,
        setForm,
        handleAddClient,
        updateStatus,
        transferClient,
        handleDeleteClient,
        saveNote
    }
}
