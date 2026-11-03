const localDay = () => {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
};
export function documentExpiry(value:string):string|null {
  if(!value.trim())return null;
  const date=value.trim();
  const parsed=new Date(date+'T00:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw new Error('Ngày hết hạn cần đúng định dạng YYYY-MM-DD.');
  if(date<=localDay())throw new Error('Ngày hết hạn phải sau hôm nay.');
  return date;
}
export function documentNumber(value:string,identity:boolean){const number=value.replace(/\s/g,'');if(identity?!/^\d{12}$/.test(number):!number||number.length>50)throw new Error(identity?'CCCD cần đủ 12 chữ số.':'Nhập số GPLX hợp lệ (tối đa 50 ký tự).');return number;}
export function documentUpdate(type:string,number:string,expires:string|null,current:{document_number:string|null;expires_at:string|null;secure_url:string;public_id:string}|undefined,replacement?:{secureUrl:string;publicId:string}){
 const document_number=type==='SELFIE'?null:number;
 if(!replacement&&current&&current.document_number===document_number&&current.expires_at===expires)return null;
 if(!replacement&&!current)throw new Error('Cần ảnh giấy tờ trước khi gửi.');
 return {document_type:type,document_number,expires_at:expires,secure_url:replacement?.secureUrl??current!.secure_url,public_id:replacement?.publicId??current!.public_id};
}
