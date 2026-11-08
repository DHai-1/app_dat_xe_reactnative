import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DriverPage } from '@/components/DriverPage';
import { useThemedStyles, type ThemeColors } from '@datxe/ui';
import { useHome } from '../hooks/useHome';
export default function DriverHomeScreen(){
  const h=useHome();
  const s=useThemedStyles(makeHomeStyles);
  const online=h.session.data?.status==='ONLINE';
  const approved=h.verification.data?.verification_status==='APPROVED';
  const buttonStyle=online?s.pauseButton:s.button;
  return <DriverPage title="Trang chủ tài xế" tabs loading={h.session.isLoading||h.active.isLoading} error={h.session.error?.message||h.verification.error?.message||h.active.error?.message||h.offer.error?.message||h.availability.error?.message} retry={()=>Promise.all([h.session.refetch(),h.verification.refetch(),h.active.refetch(),h.offer.refetch()])}>
    <View style={s.card}><Text style={s.title}>{h.session.data?.fullName??'Tài xế'}</Text></View>
    <View style={s.card}>
      <Text style={s.heroTitle}>Nhận chuyến</Text>
      <Text style={s.heroText}>{online?'Chế độ nhận chuyến đã bật.':'Chế độ nhận chuyến đang tắt.'}</Text>
      {!h.active.data&&approved&&h.session.data ? online
        ? <Pressable disabled={h.availability.isPending} onPress={()=>h.availability.mutate({online:false})} style={buttonStyle}><Text style={online?s.pauseButtonText:s.buttonText}>Tạm ngừng nhận chuyến</Text></Pressable>
        : (['CAR','MOTORCYCLE'] as const).map(type=><Pressable key={type} disabled={h.availability.isPending} onPress={()=>h.availability.mutate({online:true,vehicle_type:type})} style={s.button}><Text style={s.buttonText}>Nhận lái {type==='CAR'?'ô tô':'xe máy'}</Text></Pressable>)
        : null}
    </View>
    <View style={s.card}><Text style={s.sectionTitle}>Tình trạng nhận chuyến</Text><Text style={s.text}>{online?'Đã bật nhận chuyến · Kết nối và GPS sẵn sàng':'Chưa bật nhận chuyến'}</Text><Text style={s.gpsLink}>ⓘ  Chi tiết kết nối và GPS</Text></View>
    {h.active.data?<View style={s.card}><Text style={s.text}>Chuyến đang thực hiện #{h.active.data.id}</Text><Text style={s.text}>{h.active.data.pickupAddress} → {h.active.data.dropoffAddress}</Text><Pressable style={s.button} onPress={()=>h.router.push('/ride/in-progress')}><Text style={s.buttonText}>Tiếp tục chuyến</Text></Pressable></View>:null}
    {h.verification.data&&!approved?<Pressable onPress={()=>h.router.push('/(auth)/approval-status')}><Text style={s.link}>Hoàn tất hồ sơ xét duyệt để nhận chuyến</Text></Pressable>:null}
    {h.offer.data?<View style={s.card}><Text style={s.title}>Yêu cầu chuyến #{h.offer.data.rideId}</Text><Text style={s.text}>{h.offer.data.pickup.address} → {h.offer.data.dropoff.address}</Text><Pressable onPress={()=>h.router.push('/ride/accept')} style={s.button}><Text style={s.buttonText}>Xem yêu cầu</Text></Pressable></View>:null}
  </DriverPage>;
}

const makeHomeStyles = (colors: ThemeColors) => StyleSheet.create({
  card:{padding:24,borderRadius:28,gap:12,backgroundColor:colors.surfaceContainerLow,borderWidth:1,borderColor:colors.outlineVariant},
  title:{fontSize:28,fontWeight:'500',color:colors.onSurface},
  heroTitle:{fontSize:30,fontWeight:'500',color:colors.onSurface},
  heroText:{fontSize:22,lineHeight:30,color:colors.onSurface},
  sectionTitle:{fontSize:20,fontWeight:'500',color:colors.onSurface},
  text:{fontSize:17,lineHeight:26,color:colors.onSurface},
  button:{padding:18,borderRadius:36,backgroundColor:colors.primary,alignItems:'center'},
  buttonText:{fontSize:18,fontWeight:'500',color:colors.onPrimary},
  pauseButton:{padding:18,borderRadius:36,backgroundColor:colors.primary,alignItems:'center'},
  pauseButtonText:{fontSize:18,fontWeight:'500',color:colors.onPrimary},
  gpsLink:{fontSize:18,fontWeight:'700',color:colors.primary},
  link:{fontSize:15,color:colors.primary,fontWeight:'600'},
});
