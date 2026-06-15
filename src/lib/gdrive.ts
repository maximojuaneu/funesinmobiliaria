import { google } from 'googleapis'
import { Readable } from 'stream'

const ROOT_FOLDER = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? ''

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() })
}

/** Get or create a subfolder inside ROOT_FOLDER named "Address - City" */
export async function getOrCreatePropertyFolder(address: string, city: string): Promise<string> {
  const drive = getDrive()
  const name  = `${address} - ${city}`
  const safe  = name.replace(/'/g, "\\'")

  const list = await drive.files.list({
    q: `'${ROOT_FOLDER}' in parents and name = '${safe}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  })

  if (list.data.files?.length) return list.data.files[0].id!

  const folder = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents:  [ROOT_FOLDER],
    },
    fields: 'id',
  })

  return folder.data.id!
}

export interface DriveFile {
  id:          string
  name:        string
  mimeType:    string
  webViewLink: string
  createdTime: string
}

/** Upload a file buffer to a Drive folder */
export async function uploadToDrive(
  folderId: string,
  filename: string,
  buffer:   Buffer,
  mimeType: string,
): Promise<DriveFile> {
  const drive  = getDrive()
  const stream = Readable.from(buffer)

  const file = await drive.files.create({
    requestBody: { name: filename, parents: [folderId] },
    media:       { mimeType, body: stream },
    fields:      'id, name, mimeType, webViewLink, createdTime',
  })

  // Make file readable by anyone with the link
  await drive.permissions.create({
    fileId:      file.data.id!,
    requestBody: { role: 'reader', type: 'anyone' },
  })

  return file.data as DriveFile
}

/** List files in a folder */
export async function listFolderFiles(folderId: string): Promise<DriveFile[]> {
  const drive = getDrive()
  const list  = await drive.files.list({
    q:       `'${folderId}' in parents and trashed = false`,
    fields:  'files(id, name, mimeType, webViewLink, createdTime)',
    orderBy: 'createdTime desc',
  })
  return (list.data.files ?? []) as DriveFile[]
}
