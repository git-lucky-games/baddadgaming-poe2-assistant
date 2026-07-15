import { net } from 'electron'

export interface HttpRequestOptions {
  method: 'GET' | 'POST'
  url: string
  headers?: Record<string, string>
  body?: string
}

export interface HttpResponse {
  status: number
  headers: Record<string, string>
  body: string
}

export function request(options: HttpRequestOptions): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const req = net.request({ method: options.method, url: options.url })

    for (const [name, value] of Object.entries(options.headers ?? {})) {
      req.setHeader(name, value)
    }

    req.on('response', (response) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => chunks.push(chunk))
      response.on('error', reject)
      response.on('end', () => {
        const headers: Record<string, string> = {}
        for (const [name, value] of Object.entries(response.headers)) {
          headers[name.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value
        }
        resolve({
          status: response.statusCode,
          headers,
          body: Buffer.concat(chunks).toString('utf-8')
        })
      })
    })

    req.on('error', reject)

    if (options.body) req.write(options.body)
    req.end()
  })
}
