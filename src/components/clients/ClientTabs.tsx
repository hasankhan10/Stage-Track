'use client'

import { useState, useTransition } from 'react'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import {
    FileText,
    CheckSquare,
    MessageSquare,
    FileCheck,
    Receipt,
    AlignLeft,
    Activity,
    Upload
} from 'lucide-react'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { LogOutreachDialog } from '@/components/outreach/LogOutreachDialog'
import { FileList } from '@/components/files/FileList'
import { FileUploader } from '@/components/files/FileUploader'
import { MilestoneTracker } from '@/components/projects/MilestoneTracker'
import { DocumentEmailForm } from '@/components/clients/DocumentEmailForm'
import { ClientNotes } from '@/components/clients/ClientNotes'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

function OverviewTab({ client }: { client: any }) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-card">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Contact Information</h3>
                    <div className="space-y-2">
                        <div><span className="font-medium">Email:</span> {client.email || 'N/A'}</div>
                        <div><span className="font-medium">Phone:</span> {client.phone || 'N/A'}</div>
                    </div>
                </div>
                <div className="border rounded-lg p-4 bg-card">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Company Details</h3>
                    <div className="space-y-2">
                        <div><span className="font-medium">Company:</span> {client.company || 'N/A'}</div>
                        <div><span className="font-medium">Website:</span> {client.website || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <MilestoneTracker clientId={client.id} />
            </div>
        </div>
    )
}

export function ClientTabs({ client }: { client: any }) {
    const [fileRefreshKey, setFileRefreshKey] = useState(0)
    const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['overview']))
    const [isPending, startTransition] = useTransition()

    return (
        <Tabs
            defaultValue="overview"
            onValueChange={(val) => {
                startTransition(() => {
                    setVisitedTabs(prev => new Set(prev).add(val))
                })
            }}
            className="w-full"
        >
            <div className="overflow-x-auto pb-2 mb-4 scrollbar-none">
                <TabsList className="w-max inline-flex">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="outreach">Outreach</TabsTrigger>
                    <TabsTrigger value="proposals">Proposals</TabsTrigger>
                    <TabsTrigger value="contracts">Contracts</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="overview" className="mt-0">
                {visitedTabs.has('overview') && <OverviewTab client={client} />}
            </TabsContent>

            <TabsContent value="milestones" className="mt-0">
                {visitedTabs.has('milestones') && <MilestoneTracker clientId={client.id} />}
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
                {visitedTabs.has('tasks') && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <CreateTaskDialog
                                clients={[{ id: client.id, name: client.name }]}
                                users={client.users ? [{ id: client.users.id, name: client.users.name }] : []}
                                defaultClientId={client.id}
                            />
                        </div>
                        <EmptyState
                            icon={CheckSquare}
                            title="No Tasks Yet"
                            description="Create tasks to track deliverables for this client."
                        />
                    </div>
                )}
            </TabsContent>

            <TabsContent value="outreach" className="mt-0">
                {visitedTabs.has('outreach') && (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <LogOutreachDialog
                                clients={[{ id: client.id, name: client.name }]}
                                defaultClientId={client.id}
                            />
                        </div>
                        <EmptyState
                            icon={MessageSquare}
                            title="No Outreach Logs"
                            description="Log emails, calls, and LinkedIn messages here."
                        />
                    </div>
                )}
            </TabsContent>

            <TabsContent value="proposals" className="mt-0">
                {visitedTabs.has('proposals') && (
                    <div className="max-w-2xl mx-auto py-8">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold">Email Proposal</h3>
                            <p className="text-muted-foreground text-sm">Send a professional proposal directly to {client.name}.</p>
                        </div>
                        <DocumentEmailForm clientId={client.id} clientName={client.name} type="Proposal" />
                    </div>
                )}
            </TabsContent>

            <TabsContent value="contracts" className="mt-0">
                {visitedTabs.has('contracts') && (
                    <EmptyState
                        icon={FileCheck}
                        title="No Contracts"
                        description="Upload or generate contracts for this client."
                    />
                )}
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
                {visitedTabs.has('invoices') && (
                    <div className="max-w-2xl mx-auto py-8">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold">Email Invoice</h3>
                            <p className="text-muted-foreground text-sm">Send a PDF invoice directly to {client.name}.</p>
                        </div>
                        <DocumentEmailForm clientId={client.id} clientName={client.name} type="Invoice" />
                    </div>
                )}
            </TabsContent>

            <TabsContent value="files" className="mt-0 space-y-6">
                {visitedTabs.has('files') && (
                    <>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Client Files</h3>
                            <Dialog>
                                <DialogTrigger
                                    render={
                                        <Button>
                                            <Upload className="mr-2 h-4 w-4" /> Upload
                                        </Button>
                                    }
                                />
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Upload Client Files</DialogTitle>
                                    </DialogHeader>
                                    <FileUploader
                                        clientId={client.id}
                                        onUploadComplete={() => setFileRefreshKey(prev => prev + 1)}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <FileList clientId={client.id} refreshKey={fileRefreshKey} />
                    </>
                )}
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
                {visitedTabs.has('notes') && (
                    <ClientNotes client={client} />
                )}
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
                {visitedTabs.has('activity') && (
                    <EmptyState
                        icon={Activity}
                        title="No Activity"
                        description="Stage changes and key events will appear here automatically."
                    />
                )}
            </TabsContent>
        </Tabs>
    )
}
