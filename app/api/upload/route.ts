import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Content = buffer.toString('base64')

    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'GitHub storage credentials are not configured' }, { status: 500 })
    }

    const ext = file.name.split('.').pop() || 'png'
    // Generate a highly random unique key incorporating Date, random string, and a cryptographic-like string
    const randPart1 = Math.random().toString(36).substring(2, 10)
    const randPart2 = Math.random().toString(36).substring(2, 10)
    const uniqueFilename = `${Date.now()}-${randPart1}-${randPart2}.${ext}`

    // Normalize target folder path
    let targetPath = uniqueFilename
    if (folder && folder.trim()) {
      const cleanFolder = folder.trim().replace(/^\/+|\/+$/g, '')
      targetPath = `${cleanFolder}/${uniqueFilename}`
    }

    const githubUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}`
    const response = await fetch(githubUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'markline-cms-uploader'
      },
      body: JSON.stringify({
        message: `Upload product image: ${file.name}`,
        content: base64Content,
        branch: branch
      })
    })

    const data = await response.json()

    console.log("data from upload route", data)



    if (!response.ok) {
      console.error("GitHub upload failed error payload:", data)
      return NextResponse.json({ error: data.message || 'GitHub upload failed' }, { status: response.status })
    }

    const rawImageUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${targetPath}`
    return NextResponse.json({ success: true, url: rawImageUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload file to GitHub' }, { status: 500 })
  }
}
