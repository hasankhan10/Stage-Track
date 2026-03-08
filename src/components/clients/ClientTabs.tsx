'use client'

import { useState } from 'react'
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
    Folder,
    AlignLeft,
    Activity,
    Flag
} from 'lucide-react'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { LogOutreachDialog } from '@/components/outreach/LogOutreachDialog'
import { FileList } from '@/components/files/FileList'
import { FileUploader } from '@/components/files/FileUploader'
import { MilestoneTracker } from '@/components/projects/MilestoneTracker'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload } from 'lucide-react'

// Placeholder Tab Content Components till we build each feature out fully
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

    return (
        <Tabs defaultValue="overview" className="w-full">
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
                <OverviewTab client={client} />
            </TabsContent>

            <TabsContent value="milestones" className="mt-0">
                <MilestoneTracker clientId={client.id} />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
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
            </TabsContent>

            <TabsContent value="outreach" className="mt-0">
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
            </TabsContent>

            <TabsContent value="proposals" className="mt-0">
                <EmptyState
                    icon={FileText}
                    title="No Proposals"
                    description="Build and send proposals directly from here."
                    ctaLabel="Create Proposal"
                    ctaAction={() => window.location.href = '/proposals/new'}
                />
            </TabsContent>

            <TabsContent value="contracts" className="mt-0">
                <EmptyState
                    icon={FileCheck}
                    title="No Contracts"
                    description="Upload or generate contracts for this client."
                />
            </TabsContent>

            <TabsContent value="invoices" className="mt-0">
                <EmptyState
                    icon={Receipt}
                    title="No Invoices"
                    description="Create Stripe invoices to get paid."
                    ctaLabel="Create Invoice"
                    ctaAction={() => window.location.href = '/invoices/new'}
                />
            </TabsContent>

            <TabsContent value="files" className="mt-0 space-y-6">
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
            </TabsContent>

            <TabsContent value="notes" className="mt-0">
                <EmptyState
                    icon={AlignLeft}
                    title="No Notes"
                    description="Keep internal team notes about this client."
                    ctaLabel="Add Note"
                    ctaAction={() => { }}
                />
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
                <EmptyState
                    icon={Activity}
                    title="No Activity"
                    description="Stage changes and key events will appear here automatically."
                />
            </TabsContent>
        </Tabs>
    )
}
