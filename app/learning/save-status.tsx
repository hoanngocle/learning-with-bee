'use client';
import Link from 'next/link';
export function SaveStatus({signedIn,status,message,retry}:{signedIn:boolean;status:'idle'|'saving'|'error';message?:string;retry:()=>unknown}) {
  return <div className="learning-save-status" role="status" aria-live="polite">
    {status==='error'?<><span>{message||'Chưa lưu được tiến trình.'}</span> <button type="button" onClick={()=>retry()}>Thử lưu lại</button> <button type="button" onClick={()=>location.reload()}>Tải lại</button></>
      :!signedIn?<span><Link href="/login">Đăng nhập</Link> để lưu tiến trình và nhận thưởng. Khách đang học thử.</span>
      :status==='saving'?'Đang lưu…':'✓ Tiến trình đã lưu theo tài khoản'}
  </div>;
}
