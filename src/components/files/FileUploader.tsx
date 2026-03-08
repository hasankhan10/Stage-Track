'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Upload, X, File, Loader2 } from 'lucide-react'

interface FileUploaderProps {
    clientId: string
    onUploadComplete: () => void
}

export function FileUploader({ clientId, onUploadComplete }: FileUploaderProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const supabase = createClient()

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files))
        }
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) return

        setIsUploading(true)
        setUploadProgress(0)

        try {
            const { data: userData } = await supabase.auth.getUser()
            if (!userData.user) throw new Error('Not authenticated')

            const { data: profile } = await supabase
                .from('users')
                .select('workspace_id')
                .eq('id', userData.user.id)
                .single()

            if (!profile) throw new Error('Profile not found')

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i]
                const fileExt = file.name.split('.').pop()
                const fileName = `${Math.random()}.${fileExt}`
                const filePath = `${profile.workspace_id}/${clientId}/${fileName}`

                // 1. Upload to Storage
                const { error: uploadError, data } = await supabase.storage
                    .from('client-assets')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) throw uploadError

                // 2. Create DB Record
                const { error: dbError } = await supabase
                    .from('files')
                    .insert({
                        client_id: clientId,
                        name: file.name,
                        file_url: filePath,
                        uploaded_by: userData.user.id,
                        category: 'other', // Default category
                    })

                if (dbError) throw dbError

                setUploadProgress(((i + 1) / selectedFiles.length) * 100)
            }

            toast.success('Files uploaded successfully')
            setSelectedFiles([])
            onUploadComplete()
        } catch (error: any) {
            console.error('Upload error:', error)
            toast.error(error.message || 'Error uploading files')
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Upload Assets</h3>
                <span className="text-xs text-muted-foreground">{selectedFiles.length} files selected</span>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={onFileSelect}
                        disabled={isUploading}
                        className="cursor-pointer"
                    />
                </div>

                {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-2">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <File className="h-4 w-4 shrink-0 text-primary" />
                                    <span className="truncate">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeFile(index)}
                                    disabled={isUploading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}

                {isUploading && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span>Uploading...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-1" />
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={isUploading || selectedFiles.length === 0}
                    className="w-full"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Files
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
