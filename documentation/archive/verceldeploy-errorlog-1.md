13:53:50.377 Running build in Washington, D.C., USA (East) – iad1
13:53:50.378 Build machine configuration: 2 cores, 8 GB
13:53:50.487 Cloning github.com/wzhao918/groundwork-logbook (Branch: main, Commit: cd8e1ca)
13:53:50.488 Previous build caches not available.
13:53:50.953 Cloning completed: 466.000ms
13:53:51.491 Running "vercel build"
13:53:52.888 Vercel CLI 53.2.0
13:53:53.154 Installing dependencies...
13:54:01.944 
13:54:01.944 added 113 packages in 9s
13:54:01.945 
13:54:01.945 27 packages are looking for funding
13:54:01.945   run `npm fund` for details
13:54:02.012 Detected Next.js version: 15.5.18
13:54:02.019 Running "npm run build"
13:54:02.118 
13:54:02.118 > groundwork-logbook@0.1.0 build
13:54:02.118 > next build
13:54:02.119 
13:54:02.625 Attention: Next.js now collects completely anonymous telemetry regarding usage.
13:54:02.626 This information is used to shape Next.js' roadmap and prioritize features.
13:54:02.626 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
13:54:02.626 https://nextjs.org/telemetry
13:54:02.627 
13:54:02.704    ▲ Next.js 15.5.18
13:54:02.705 
13:54:02.734    Creating an optimized production build ...
13:54:12.228  ✓ Compiled successfully in 7.2s
13:54:12.231    Linting and checking validity of types ...
13:54:15.179 Failed to compile.
13:54:15.180 
13:54:15.187 ./lib/session.ts:55:7
13:54:15.187 Type error: Argument of type 'Uint8Array<ArrayBufferLike>' is not assignable to parameter of type 'BufferSource'.
13:54:15.187   Type 'Uint8Array<ArrayBufferLike>' is not assignable to type 'ArrayBufferView<ArrayBuffer>'.
13:54:15.187     Types of property 'buffer' are incompatible.
13:54:15.188       Type 'ArrayBufferLike' is not assignable to type 'ArrayBuffer'.
13:54:15.188         Type 'SharedArrayBuffer' is not assignable to type 'ArrayBuffer'.
13:54:15.188           Types of property '[Symbol.toStringTag]' are incompatible.
13:54:15.188             Type '"SharedArrayBuffer"' is not assignable to type '"ArrayBuffer"'.
13:54:15.189 
13:54:15.189   53 |       'HMAC',
13:54:15.189   54 |       key,
13:54:15.189 > 55 |       sig,
13:54:15.189      |       ^
13:54:15.189   56 |       encoder.encode(payload),
13:54:15.190   57 |     )
13:54:15.190   58 |   } catch {
13:54:15.213 Next.js build worker exited with code: 1 and signal: null
13:54:15.243 Error: Command "npm run build" exited with 1