import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MAYA — An illustrated atlas', icons: { icon: '/maya/favicon.svg' }, description: 'Explore 5,223 archaeological site records across the Maya world. An interactive OpenStreetMap atlas with illustrated field notes and cinematic map journeys.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
