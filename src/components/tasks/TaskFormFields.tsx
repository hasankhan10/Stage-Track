'use client'

import React from 'react'
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flag, Calendar, User, Briefcase, FileText } from 'lucide-react'

interface TaskFormFieldsProps {
    form: any
    clients: { id: string, name: string }[]
    users: { id: string, name: string }[]
    defaultClientId?: string
}

export const TaskFormFields = React.memo(({ form, clients, users, defaultClientId }: TaskFormFieldsProps) => {
    return (
        <div className="space-y-5 py-2">
            <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Task Objective</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Finalize strategic Q3 roadmap" {...field} className="h-11 bg-background focus:ring-2 focus:ring-primary/20 rounded-xl transition-all border-border/60 font-bold" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Execution details</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Define specific deliverables and milestones..." {...field} className="min-h-[100px] bg-background focus:ring-2 focus:ring-primary/20 rounded-xl transition-all border-border/60 resize-none font-medium leading-relaxed" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-5">
                <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                                <Flag className="h-3 w-3" /> Priority Tier
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-11 rounded-xl border-border/60 font-bold">
                                        <SelectValue placeholder="Select tier" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl shadow-premium border-border/40">
                                    <SelectItem value="Low" className="focus:bg-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-slate-400" />
                                            <span>Low Impact</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="Medium" className="focus:bg-blue-50/50">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span>Standard Priority</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="High" className="focus:bg-rose-50/50">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-rose-500" />
                                            <span>Critical Execution</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> Target Date
                            </FormLabel>
                            <FormControl>
                                <Input type="date" {...field} className="h-11 rounded-xl border-border/60 font-bold" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-2 gap-5">
                <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                                <Briefcase className="h-3 w-3" /> Account Context
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!!defaultClientId}>
                                <FormControl>
                                    <SelectTrigger className="h-11 rounded-xl border-border/60 font-bold">
                                        <SelectValue placeholder="Link to account">
                                            {clients.find(c => c.id === field.value)?.name}
                                        </SelectValue>
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl shadow-premium border-border/40 max-h-[250px]">
                                    <SelectItem value="none" className="font-bold text-muted-foreground">Internal / Non-Client</SelectItem>
                                    {clients.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="focus:bg-primary/5 font-medium">{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="assigned_to"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
                                <User className="h-3 w-3" /> Responsible Party
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-11 rounded-xl border-border/60 font-bold">
                                        <SelectValue placeholder="Assign operative" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl shadow-premium border-border/40">
                                    <SelectItem value="none" className="font-bold text-muted-foreground">Unassigned</SelectItem>
                                    {users.map(u => (
                                        <SelectItem key={u.id} value={u.id} className="focus:bg-primary/5 font-medium">{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
})

TaskFormFields.displayName = 'TaskFormFields'
