import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const token = process.env.GITHUB_TOKEN
    const owner = process.env.GITHUB_OWNER
    const repo = process.env.GITHUB_REPO
    const branch = process.env.GITHUB_BRANCH || 'main'

    if (!token || !owner || !repo) {
      return NextResponse.json({ error: 'GitHub credentials not configured in env' }, { status: 500 })
    }

    // Call GitHub trees API recursively to retrieve directory trees
    const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    const res = await fetch(treeUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.message || 'Failed to fetch tree from GitHub' }, { status: res.status })
    }

    const data = await res.json()
    const rawTree = data.tree || []

    // Filter list to keep folders only
    const folders = rawTree
      .filter((item: any) => item.type === 'tree')
      .map((item: any) => item.path)
      .sort()

    return NextResponse.json({ success: true, folders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
