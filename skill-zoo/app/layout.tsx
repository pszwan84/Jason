
import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Skill Zoo · 让经验自由生长',description:'让经验长成 Skill，让 Skill 连接到人。带着一个真实问题来，遇见一起生长的伙伴。',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
