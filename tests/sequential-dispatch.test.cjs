const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file,mocks={}) {
  const exports={};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports,require:name=>{if(name in mocks)return mocks[name];throw Error(name);}});
  return exports;
}
test('accept and reject send the exact offer token the driver reviewed',async()=>{
  const calls=[];
  const api=load('apps/driver/src/features/offers/api.ts',{'@/lib/api':{request:async(path,options)=>{calls.push({path,options});}},'@/lib/driverApi':{driverApi:{}}});
  await api.acceptDriverOffer(42,'offer-a');await api.rejectDriverOffer(42,'offer-b');
  assert.equal(calls[0].path,'/driver/offers/42/accept');assert.equal(calls[0].options.body.offerId,'offer-a');
  assert.equal(calls[1].options.body.offerId,'offer-b');
});
test('offer countdown is twenty-five seconds with a two second server margin even on a skewed phone',()=>{
  const {offerRemainingMs}=load('apps/driver/src/lib/offerTiming.ts');
  const offer={serverTime:100000,expiresAt:127000,clientExpiresAt:125000};
  for(const received of [1000,100000,10000000]) {
    assert.equal(offerRemainingMs(offer,received,received),25000);
    assert.equal(offerRemainingMs(offer,received,received+4000),21000);
    assert.equal(offerRemainingMs(offer,received,received+25000),0);
  }
  assert.equal(offerRemainingMs({...offer,clientExpiresAt:90000},0,0),0);
  assert.equal(offerRemainingMs({...offer,serverTime:NaN},0,0),0);
});
test('redispatch and system failure notifications explain the actual outcome',()=>{
  const {getNotificationText}=load('packages/shared/src/notifications/display.ts',{'../i18n':{translate:value=>value}});
  assert.equal(getNotificationText('RIDE_UPDATED',{status:'SEARCHING',redispatchCount:1}).title,'Đang tìm tài xế khác');
  assert.equal(getNotificationText('RIDE_NO_DRIVER',{status:'FAILED_SYSTEM'}).title,'Lỗi hệ thống');
});
