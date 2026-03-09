'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import {
    FileText,
    MoreHorizontal,
    Download,
    Trash2,
    ExternalLink,
    FileIcon,
    ImageIcon,
    FileVideo,
    FileCode
} from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface FileListProps {
    clientId: string
    refreshKey: number
}

export function FileList({ clientId, refreshKey }: FileListProps) {
    const [files, setFiles] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])

    const fetchFiles = useCallback(async () => {
        try {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('files')
                .select(`
                    *,
                    users (name)
                `)
                .eq('client_id', clientId)
                .order('uploaded_at', { ascending: false })

            if (error) throw error
            setFiles(data || [])
        } catch (error: any) {
            toast.error('Failed to load files')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [clientId, refreshKey, supabase])

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'pdf':
            case 'doc':
            case 'docx':
                return <FileText className="h-4 w-4 text-blue-500" />
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'svg':
            case 'gif':
                return <ImageIcon className="h-4 w-4 text-pink-500" />
            case 'mp4':
            case 'mov':
            case 'avi':
                return <FileVideo className="h-4 w-4 text-purple-500" />
            case 'ts':
            case 'tsx':
            case 'js':
            case 'jsx':
            case 'json':
            case 'html':
            case 'css':
                return <FileCode className="h-4 w-4 text-amber-500" />
            default:
                return <FileIcon className="h-4 w-4 text-gray-500" />
        }
    }

    const handleDownload = async (file: any) => {
        try {
            const { data, error } = await supabase.storage
                .from('client-assets')
                .createSignedUrl(file.file_url, 60) // 1 minute expiry

            if (error) throw error
            window.open(data.signedUrl, '_blank')
        } catch (error) {
            toast.error('Failed to generate download link')
        }
    }

    const handleDelete = async (file: any) => {
        if (!confirm('Are you sure you want to delete this file?')) return

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('client-assets')
                .remove([file.file_url])

            if (storageError) throw storageError

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('files')
                .delete()
                .eq('id', file.id)

            if (dbError) throw dbError

            toast.success('File deleted')
            fetchFiles()
        } catch (error) {
            toast.error('Failed to delete file')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        )
    }

    if (files.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">No files uploaded yet.</p>
            </div>
        )
    }

    return (
        <Card className="border-none shadow-none">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Uploaded By</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {files.map((file) => (
                            <TableRow key={file.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-3">
                                        {getFileIcon(file.name)}
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {file.category}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {file.users?.name || 'System'}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {format(new Date(file.uploaded_at), 'MMM d, yyyy')}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            }
                                        />
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                                                <Download className="mr-2 h-4 w-4" /> Download
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                                                <ExternalLink className="mr-2 h-4 w-4" /> Open
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={() => handleDelete(file)}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
