'use strict';
const $=id=>document.getElementById(id);
const sources={
 onin:'https://ja.kyoto.travel/tourism/single02.php?category_id=9&tourism_id=49',
 ikk:'https://digilib.city.kanazawa.ishikawa.jp/preview/pdf/BFEMdwAAA',
 gun:'https://www.kyohaku.go.jp/jp/learn/home/dictio/shikki/nanban/',
 oke:'https://www.museum.city.nagoya.jp/exhibition/special/past/tenji0616.html',
 kyoto:'https://www.city.kyoto.lg.jp/sogo/page/0000015599.html',
 shogun:'https://www.city.kyoto.lg.jp/fushimi/page/0000013315.html',
 naga:'https://www.archives.go.jp/exhibition/digital/ieyasu/history.html',
 honno:'https://ja.kyoto.travel/akechi/',
 shizu:'https://www.osakacastle.net/toyotomi_stone_wall/column/',
 oda:'https://odawaracastle.com/history/hojo-godai/',
 korea:'https://archive.rekihaku.ac.jp/exhibitions/project/old/001003/kosei.html',
 sek:'https://www.archives.go.jp/exhibition/digital/ieyasu/contents3_01/',
 edo:'https://www.archives.go.jp/exhibition/digital/shogunnoarchives/momijiyama.html',
 osaka:'https://www.osakacastle.net/toyotomi_stone_wall/?lang=ja'
};
const scenes=[
 {year:1467,era:'應仁元年',title:'應仁之亂',tag:'亂世之始',summary:'京都戰火蔓延，室町幕府的號令力逐步減弱。',cause:'將軍繼承與畠山、斯波等守護家的家督爭議交錯，細川勝元與山名宗全所屬的陣營在京都衝突。',effect:'戰事延續到 1477 年，京都嚴重受損。地方守護與家臣更依靠自己的兵力治理；各地的變局並非同時由這一戰直接造成。',people:['足利義政','細川勝元','山名宗全'],note:'東軍與西軍是參戰聯盟，並非兩個擁有整齊國界的政權；地圖上的斜紋代表多方勢力。',source:'onin',battle:[279,427,'京都'],route:'M299 419 Q289 423 279 427'},
 {year:1488,era:'長享二年',title:'加賀一向一揆',tag:'地方秩序改變',summary:'加賀的門徒與地方武士起事，擊敗守護富樫政親。',cause:'守護徵發與地方權力矛盾激化，浄土真宗門徒、國人等群體結合，在加賀挑戰富樫氏。',effect:'守護被推翻後，加賀形成與本願寺相關的地方權力結構。戰國的主角不只有著名大名，宗教團體與地方社群也在重組秩序。',people:['富樫政親','本願寺門徒'],note:'所謂「百姓之國」是傳統說法；一揆的構成、治理與本願寺的關係都有變化，不能概括成單一階層統治一百年。',source:'ikk',battle:[302,373,'加賀'],route:null},
 {year:1543,era:'天文十二年',title:'鐵砲傳入',tag:'技術與交易',summary:'火繩槍傳入種子島，逐漸進入戰國軍事與商業網絡。',cause:'葡萄牙商人經海上交通到達種子島，當地領主購得火繩槍；工匠、商人與領主隨後模仿、製造及流通。',effect:'火器在數十年間被各地軍隊採用，影響戰場組織與城郭攻防；它並未在傳入當年立刻改變全部戰爭。',people:['種子島時堯','葡萄牙商人','鐵匠'],note:'1543 年是通行年表的傳入年份；海上交易與技術擴散是持續過程。種子島的標記只用來指出事件位置。',source:'gun',battle:[113,589,'種子島'],route:'M56 558 Q81 572 113 589'},
 {year:1560,era:'永祿三年',title:'桶狹間之戰',tag:'尾張轉折',summary:'織田信長擊敗今川義元，東海道的局面隨之變動。',cause:'今川軍進入尾張，信長從清洲出兵，在桶狹間附近攻擊今川本隊，義元戰死。',effect:'今川氏勢力受挫；松平元康（後來的德川家康）脫離今川體系，信長則逐步擴張，之後才有進入京都的條件。',people:['織田信長','今川義元','松平元康'],note:'信長兵力、天候與奇襲過程在不同敘述中有差異；此處不以單一戲劇化版本重演戰場。',source:'oke',battle:[320,424,'桶狹間'],route:'M384 409 Q352 418 320 424'},
 {year:1568,era:'永祿十一年',title:'信長奉義昭入京',tag:'走向畿內',summary:'信長擁立足利義昭，取得在京都施政的立足點。',cause:'義昭尋求軍事支持以就任將軍；信長整合尾張、美濃與近江方向的路線，率軍進入京都。',effect:'義昭成為第十五代將軍，信長的軍事力量伸入畿內。兩人的合作後來破裂，並不意味此時室町幕府已經結束。',people:['織田信長','足利義昭','六角承禎'],note:'此幕以信長在中部及畿內的政治軍事影響著色；不表示所有地區都由其直接領有。',source:'kyoto',route:'M318 422 Q296 417 279 427'},
 {year:1573,era:'天正元年',title:'室町幕府終結',tag:'將軍離京',summary:'信長逐走義昭，室町幕府在京都的統治告終。',cause:'信長與義昭的權力關係日益惡化，義昭聯絡反信長勢力；經過交戰，義昭離開京都。',effect:'信長成為畿內最具優勢的軍事力量，但武田、上杉、毛利、本願寺等仍各有實力，統一尚未完成。',people:['織田信長','足利義昭','淺井長政','朝倉義景'],note:'義昭離京後仍保有將軍名義多年；「幕府終結」指其在京都的政權結構瓦解。',source:'shogun',battle:[279,427,'京都'],route:null},
 {year:1575,era:'天正三年',title:'長篠之戰',tag:'武田勢力受挫',summary:'織田與德川聯軍擊敗武田勝賴，東部戰線改變。',cause:'武田軍包圍長篠城，織田信長與德川家康派聯軍救援，在設樂原與武田軍交戰。',effect:'武田軍遭到重大損失，家康在三河、遠江的地位加強。勝賴仍維持武田政權，直到 1582 年才滅亡。',people:['織田信長','德川家康','武田勝賴'],note:'火繩槍確實參與戰鬥，但「三千鐵砲三段擊」不能當作已證實的固定戰術或唯一勝因。',source:'naga',battle:[340,429,'長篠'],route:'M371 396 Q353 415 340 429'},
 {year:1582,era:'天正十年',title:'本能寺之變',tag:'織田政權中斷',summary:'明智光秀襲擊本能寺，信長死於京都。',cause:'信長正部署對毛利等勢力的戰事，光秀率軍轉向京都，突襲停留於本能寺的信長。起事動機至今並無可完全定論的單一解釋。',effect:'羽柴秀吉迅速回師，在山崎之戰擊敗光秀；織田家內部接著爭奪繼承與實權，天下統一的主導權轉移。',people:['織田信長','明智光秀','羽柴秀吉'],note:'「中國大返還」是對秀吉回師的後世概稱；本幕的箭頭表示回師大方向。',source:'honno',battle:[279,427,'本能寺'],route:'M161 445 Q215 421 279 427'},
 {year:1583,era:'天正十一年',title:'賤岳之戰',tag:'秀吉取得主導',summary:'秀吉擊敗柴田勝家，開始以大坂作為新據點。',cause:'信長死後，家臣對繼承及領地安排的分歧擴大；羽柴秀吉與柴田勝家在近江北部交戰。',effect:'勝家敗亡，秀吉在原織田勢力中取得更大主導權，同年開始興建大坂城，並繼續整合周邊大名。',people:['羽柴秀吉','柴田勝家','前田利家'],note:'1583 年仍有反對秀吉的勢力；從賤岳勝利到全國統合是多年過程。',source:'shizu',battle:[294,408,'賤岳'],route:'M269 440 Q278 419 294 408'},
 {year:1590,era:'天正十八年',title:'小田原征伐',tag:'全國統合',summary:'後北條氏投降，秀吉的全國統合達到重要階段。',cause:'秀吉透過戰爭、同盟與臣服關係擴張統治；與後北條氏的關係破裂後，動員多路大軍包圍小田原。',effect:'小田原開城，秀吉將德川家康轉封關東，並進一步整合東北大名。全國各地仍由眾多大名治理，並非都變成豐臣家的直轄地。',people:['豐臣秀吉','北條氏直','德川家康'],note:'地圖的「豐臣」色表示政治從屬與軍事聯盟；「德川」色表示關東轉封後的勢力。',source:'oda',battle:[396,417,'小田原'],route:'M269 439 Q329 409 396 417'},
 {year:1592,era:'文祿元年',title:'侵朝戰爭開始',tag:'戰火跨海',summary:'秀吉自九州出兵侵略朝鮮，戰爭擴及朝鮮與明朝。',cause:'統合國內後，秀吉命令大名動員渡海，從釜山等地入侵朝鮮半島。朝鮮軍民與義兵抵抗，明朝亦出兵。',effect:'1592–1593 年的第一次侵略未達目標；1597 年再次出兵，直到秀吉於 1598 年死後撤軍。戰爭造成朝鮮重大人命損失與社會破壞，也耗費日本資源。',people:['豐臣秀吉','李舜臣','小西行長','加藤清正'],note:'日本史常稱「文祿・慶長之役」，朝鮮史稱「壬辰倭亂／丁酉再亂」。地圖不把朝鮮畫成日本勢力領土。',source:'korea',route:'M96 480 Q44 447 8 396'},
 {year:1600,era:'慶長五年',title:'關原之戰',tag:'東西兩軍',summary:'德川家康所屬東軍獲勝，豐臣政權內的權力重心轉移。',cause:'秀吉去世後，幼主秀賴無法親政，重臣間的政治與軍事衝突升高。石田三成等組織西軍，家康集結東軍。',effect:'東軍勝利使家康在大名之間占優勢，參戰者的領地大幅重新分配；豐臣家仍存在，大坂城也尚未落入德川直轄。',people:['德川家康','石田三成','毛利輝元','小早川秀秋'],note:'東西軍並非地圖上沿著一條直線劃分，許多大名的歸屬與軍事行動都更複雜。色塊只標示重要陣營與影響範圍。',source:'sek',battle:[303,413,'關原'],route:'M416 401 Q358 391 303 413'},
 {year:1603,era:'慶長八年',title:'江戶幕府成立',tag:'新秩序建立',summary:'家康獲任征夷大將軍，在江戶建立新的武家政權。',cause:'關原戰後家康掌握重要軍事與政治優勢，取得將軍任命，以江戶為統治中心。',effect:'幕府逐步建立對各大名的統治制度；豐臣秀賴仍在大坂城，兩家的權力與正統性爭議沒有立即消失。',people:['德川家康','豐臣秀賴'],note:'德川色表示幕府的全國性統治架構，不代表每一塊色區均為德川家直轄領。',source:'edo',route:'M279 427 Q348 381 416 401'},
 {year:1615,era:'慶長二十年／元和元年',title:'大坂夏之陣',tag:'戰國終章',summary:'大坂城陷落，豐臣家滅亡，德川政權進一步穩固。',cause:'德川與豐臣間的緊張在 1614 年大坂冬之陣爆發。和議後仍難消除對立，翌年再起戰端。',effect:'德川方攻陷大坂，豐臣秀賴與淀殿死亡。幕府同年公布武家諸法度等規範，持續塑造新的政治秩序。',people:['德川家康','德川秀忠','豐臣秀賴','真田信繁'],note:'「戰國終章」是一種分期方式；1615 年並不意味日本往後完全沒有戰事。',source:'osaka',battle:[269,439,'大坂'],route:'M416 401 Q341 412 269 439'}
];
const japanMap=window.japanMap;
const regions=[
 {id:'northKyushu',name:'北九州'},
 {id:'bungo',name:'豐後'},
 {id:'satsuma',name:'南九州'},
 {id:'shikoku',name:'四國'},
 {id:'chugokuW',name:'中國西部',short:'中國西'},
 {id:'sanin',name:'山陰'},
 {id:'chugokuE',name:'中國東部',short:'中國東'},
 {id:'settsu',name:'攝津・大坂',short:'攝津'},
 {id:'yamato',name:'大和・紀伊',short:'大和'},
 {id:'omi',name:'近江・京都',short:'近江'},
 {id:'kaga',name:'加賀・越前',short:'加賀'},
 {id:'hida',name:'飛驒'},
 {id:'echigo',name:'越後・北陸',short:'越後'},
 {id:'owari',name:'尾張・美濃',short:'尾張'},
 {id:'tokai',name:'三河・駿河',short:'東海'},
 {id:'koshin',name:'甲信'},
 {id:'kanto',name:'關東'},
 {id:'tohokuS',name:'南奧羽'},
 {id:'tohokuN',name:'北奧羽'}
].map(r=>({...r,...japanMap.regions[r.id]}));
const parties={
 mixed:{name:'多方勢力',color:'url(#disputed)',mark:''},
 local:{name:'地方大名',color:'#6f7580',mark:''},
 ashikaga:{name:'室町幕府勢力',color:'#6b7d97',mark:'幕'},
 ikko:{name:'一向一揆',color:'#7f7a45',mark:'一揆'},
 oda:{name:'織田',color:'#b2604f',mark:'織田'},
 imagawa:{name:'今川',color:'#c58fc0',mark:'今川'},
 takeda:{name:'武田',color:'#7a3448',mark:'武田'},
 uesugi:{name:'上杉',color:'#4f74b0',mark:'上杉'},
 hojo:{name:'後北條',color:'#7c5fb0',mark:'北條'},
 mori:{name:'毛利',color:'#3f7f86',mark:'毛利'},
 amago:{name:'尼子',color:'#4b5d73',mark:'尼子'},
 otomo:{name:'大友',color:'#9fae6a',mark:'大友'},
 shimazu:{name:'島津',color:'#c27a8a',mark:'島津'},
 chosokabe:{name:'長宗我部',color:'#9a6f3f',mark:'長宗我部'},
 miyoshi:{name:'三好',color:'#c79a5a',mark:'三好'},
 tokugawa:{name:'德川',color:'#5d8a52',mark:'德川'},
 toyotomi:{name:'豐臣政權',color:'#d4a94e',mark:'豐臣'},
 west:{name:'西軍陣營',color:'#9d7389',mark:'西'},
 east:{name:'東軍陣營',color:'#619399',mark:'東'},
 bakufu:{name:'幕府影響',color:'#4f8f8a',mark:'幕府'}
};
const ids=regions.map(r=>r.id);const base=k=>Object.fromEntries(ids.map(id=>[id,k]));
const control=[];
control[0]={...base('local'),settsu:'mixed',omi:'mixed',yamato:'mixed',chugokuE:'mixed'};
control[1]={...control[0],kaga:'ikko',settsu:'mixed',omi:'mixed'};
control[2]={...base('local'),kaga:'ikko',echigo:'uesugi',owari:'oda',tokai:'imagawa',koshin:'takeda',kanto:'hojo',northKyushu:'mixed',bungo:'otomo',satsuma:'shimazu',chugokuW:'mori',chugokuE:'amago',sanin:'amago',settsu:'miyoshi',omi:'mixed',yamato:'mixed',shikoku:'mixed'};
control[3]={...control[2],chugokuE:'mori',tokai:'mixed'};
control[4]={...control[3],chugokuE:'mori',sanin:'mori',kaga:'ikko',owari:'oda',omi:'oda',settsu:'mixed',yamato:'mixed',tokai:'tokugawa',shikoku:'chosokabe'};
control[5]={...control[4],settsu:'mixed',yamato:'oda',omi:'oda',kaga:'ikko'};
control[6]={...control[5],tokai:'tokugawa',koshin:'takeda',kaga:'mixed'};
control[7]={...control[6],koshin:'oda',kaga:'oda',hida:'local',settsu:'oda',yamato:'oda',shikoku:'chosokabe',northKyushu:'mixed',chugokuE:'mori',sanin:'mori'};
control[8]={...control[7],omi:'toyotomi',settsu:'toyotomi',yamato:'toyotomi',owari:'mixed',koshin:'tokugawa',kaga:'mixed',hida:'local'};
control[9]={...base('toyotomi'),kanto:'tokugawa',tokai:'tokugawa',koshin:'tokugawa',tohokuS:'local',tohokuN:'local',satsuma:'shimazu',bungo:'otomo',northKyushu:'mixed',chugokuW:'mori',chugokuE:'mori',sanin:'mori',shikoku:'chosokabe'};
control[10]={...control[9],northKyushu:'toyotomi',bungo:'toyotomi',shikoku:'toyotomi',satsuma:'shimazu',tohokuS:'local',tohokuN:'local'};
control[11]={...base('west'),kanto:'east',tokai:'east',koshin:'east',tohokuS:'east',tohokuN:'mixed',owari:'east',omi:'mixed',kaga:'east',hida:'east',echigo:'mixed',settsu:'mixed',yamato:'mixed',northKyushu:'mixed',bungo:'east',satsuma:'west',shikoku:'mixed'};
control[12]={...base('bakufu'),settsu:'toyotomi',yamato:'mixed',chugokuW:'local',chugokuE:'local',sanin:'local',shikoku:'local',satsuma:'local',northKyushu:'local',bungo:'local',tohokuN:'local',tohokuS:'local'};
control[13]={...control[12],settsu:'bakufu',yamato:'bakufu'};
const regionDetails={
 northKyushu:'筑前、肥前一帶聚合許多大名與地方勢力；一種顏色不能代表整片九州。',
 bungo:'豐後及九州東部的重要勢力，實際統治範圍隨戰事改變。',
 satsuma:'薩摩及九州南部。島津家的勢力由此擴展，但地圖未畫郡與村落的歸屬。',
 shikoku:'四國由多方勢力競逐，長宗我部家後來從土佐擴大影響；此塊不等同四國全島同時易手。',
 chugokuW:'中國地方西部的勢力概況；毛利家經多年擴張，並非在同一年控制全部地區。',
 chugokuE:'中國地方東部的主要政治軍事影響，地方大名與盟友依然各有領地。',
 sanin:'山陰地區的主要勢力概況；尼子與毛利爭奪多年。',
 settsu:'大坂與攝津周邊的政治中心；石山本願寺、三好、織田、豐臣等勢力在不同時期交錯。',
 yamato:'畿內南部及紀伊的概況，寺社、國人與大名勢力並立。',
 omi:'近江與京都通道。京都權力的更替不等於近江每座城池同時換主。',
 kaga:'加賀及越前部分地區；本願寺門徒和地方武士等勢力在這裡持續活動。',
 hida:'飛驒位於北陸與美濃、信濃之間。此圖以概略區塊呈現，實際領主與邊界隨時期變動。',
 echigo:'越後與日本海沿岸；上杉家的勢力與周邊大名長期角力。',
 owari:'尾張與美濃一帶，織田家經多年才擴大力量。',
 tokai:'三河、遠江、駿河的示意合區；今川、德川與武田在不同地點長期競逐。',
 koshin:'甲斐、信濃的示意合區，不能從單一色塊推論完整勢力邊界。',
 kanto:'關東是後北條、上杉及德川等勢力先後角逐的重要地域。',
 tohokuS:'奧羽南部各家勢力並立；圖中僅顯示代表性陣營。',
 tohokuN:'奧羽北部各家勢力並立；納入豐臣政權後仍保有地方大名的治理。'
};
const cities=[{name:'京都',x:279,y:427,dx:-30,dy:-11},{name:'大坂',x:269,y:439,dx:-32,dy:17},{name:'江戶',x:416,y:401,dx:9,dy:-10},{name:'清洲',x:318,y:422,dx:9,dy:14},{name:'小田原',x:396,y:417,dx:9,dy:17},{name:'博多',x:96,y:483,dx:-32,dy:-9}];
const chapterCN=['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四'];
let index=0,playing=false,elapsed=0,lastTime=0,speed=1,selectedRegion=null;
const focusRegions=[['omi','settsu'],['kaga'],['satsuma'],['owari','tokai'],['owari','omi'],['omi'],['owari','koshin'],['omi','owari'],['omi','kaga'],['kanto'],['northKyushu'],['omi','koshin'],['kanto'],['settsu']];
const storyBeats=[
 ['將軍與守護家爭奪繼承','京都陷入東西軍交戰','幕府權威逐漸鬆動'],
 ['加賀的矛盾升高','門徒與地方武士起事','守護被推翻，地方秩序改變'],
 ['海上商人抵達種子島','火繩槍開始傳入日本','技術逐步擴散到各地'],
 ['今川軍進入尾張','信長在桶狹間擊敗義元','東海道局勢出現轉折'],
 ['足利義昭尋求軍事支持','信長率軍進入京都','信長取得畿內立足點'],
 ['義昭與信長關係破裂','義昭離開京都','幕府在京都的統治告終'],
 ['武田軍包圍長篠城','織田與德川聯軍迎戰','武田軍遭受重大損失'],
 ['光秀率軍轉向京都','本能寺遭突襲，信長身亡','秀吉回師，繼承之爭展開'],
 ['織田家臣爭奪主導權','秀吉在賤岳擊敗勝家','秀吉的力量繼續擴大'],
 ['豐臣政權動員各地大名','小田原被包圍並開城','全國統合進入新階段'],
 ['秀吉命令大名渡海','戰爭擴及朝鮮半島','朝鮮遭受重大人命與社會損失'],
 ['豐臣重臣之間衝突升高','東西兩軍在關原交戰','家康取得政治軍事優勢'],
 ['家康取得將軍任命','江戶幕府開始建立','各大名納入新的統治秩序'],
 ['德川與豐臣再起戰端','大坂城陷落','豐臣家滅亡，德川政權穩固']
];
let stage=0,stageTime=0,routePath=null,routeLength=0,travelDot=null,battleMark=null;
const canNarrate=typeof window!=='undefined'&&'speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
let utterance=null,narrationState='idle',narrationToken=0;
const ns='http://www.w3.org/2000/svg';
function svgNode(tag,attrs,parent,text){const n=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;if(parent)parent.appendChild(n);return n}
for(const island of ['honshu','kyushu','shikoku']){const clip=svgNode('clipPath',{id:'clip-'+island},document.querySelector('#atlas defs'));svgNode('path',{d:japanMap.coast[island]},clip);svgNode('path',{d:japanMap.coast[island],class:'main-coast'},$('coastline'))}
for(const key of ['hokkaido','islets'])svgNode('path',{d:japanMap.coast[key],class:key==='hokkaido'?'context-coast':'islet-coast'},$('coast'));
for(const r of regions){const p=svgNode('polygon',{points:r.points,class:'territory',id:'region-'+r.id,tabindex:'0',role:'button','aria-label':r.name,'clip-path':`url(#clip-${r.island})`},$('regions'));p.addEventListener('click',e=>inspect(r.id,e));p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(r.id)}});svgNode('text',{x:r.label[0]+(r.id==='sanin'?-7:0),y:r.label[1],class:'province-name pv-'+r.id+(['settsu','yamato','omi','owari','hida'].includes(r.id)?' compact':''),},$('regionNames'),r.short||r.name)}
scenes.forEach((s,i)=>{const b=document.createElement('button');b.className='chapter';b.innerHTML=`<span class="number">${String(i+1).padStart(2,'0')}</span><span><strong>${s.title}</strong><small>${s.year} 年</small></span>`;b.setAttribute('aria-label',`第${i+1}幕，${s.year}年，${s.title}`);b.addEventListener('click',()=>go(i));$('chapters').appendChild(b);const d=document.createElement('button');d.className='scale-dot';d.style.setProperty('--pos',(100*(0.6*i/13+0.4*(s.year-1467)/148))+'%');d.style.setProperty('--even',(100*i/13)+'%');d.dataset.year=s.year;d.title=`${s.year} · ${s.title}`;d.setAttribute('aria-label',`${s.year}年，${s.title}`);d.addEventListener('click',()=>go(i));$('yearScale').appendChild(d)});
const swatch=key=>key==='mixed'?'repeating-linear-gradient(125deg,#958765 0 3px,#253b3d 3px 6px)':parties[key].color;
let tipAnchor=null;
function inspect(id,evt){selectedRegion=id;for(const r of regions)$('region-'+r.id).classList.toggle('selected',r.id===id);
 const r=regions.find(r=>r.id===id),key=control[index][id],tip=$('regionTip'),wrap=document.querySelector('.map-wrap');
 tip.innerHTML=`<button type="button" class="tip-close" aria-label="關閉">×</button><div class="tip-head"><i style="background:${swatch(key)}"></i><strong>${r.name}</strong><span>${scenes[index].year} 年 · ${parties[key].name}</span></div><p>${regionDetails[id]}</p>`;
 tip.querySelector('.tip-close').addEventListener('click',closeTip);
 if(evt&&evt.clientX!==undefined&&evt.detail!==0)tipAnchor={client:[evt.clientX,evt.clientY]};else if(evt||!tipAnchor)tipAnchor={svg:r.label};
 tip.hidden=false;positionTip();if(typeof syncInsetSelected==='function')syncInsetSelected()}
function positionTip(){const tip=$('regionTip');if(tip.hidden||!tipAnchor)return;const box=document.querySelector('.map-wrap').getBoundingClientRect();let x,y;
 if(tipAnchor.client){[x,y]=tipAnchor.client;x-=box.left;y-=box.top}else{const m=$('atlas').getScreenCTM(),pt=$('atlas').createSVGPoint();pt.x=tipAnchor.svg[0];pt.y=tipAnchor.svg[1];const q=pt.matrixTransform(m);x=q.x-box.left;y=q.y-box.top}
 const w=tip.offsetWidth,h=tip.offsetHeight;tip.style.left=Math.round(Math.min(Math.max(8,x+16),box.width-w-8))+'px';tip.style.top=Math.round(y-h-16>=8?y-h-16:Math.min(y+16,box.height-h-8))+'px'}
function closeTip(){$('regionTip').hidden=true;tipAnchor=null;selectedRegion=null;for(const r of regions)$('region-'+r.id).classList.remove('selected');if(typeof syncInsetSelected==='function')syncInsetSelected()}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('regionTip').hidden){closeTip()}});
document.addEventListener('pointerdown',e=>{if(!$('regionTip').hidden&&!e.target.closest('#regionTip,.territory'))closeTip()});
addEventListener('resize',positionTip);
function renderLegend(){const counts={};for(const k of Object.values(control[index]))counts[k]=(counts[k]||0)+1;
 const keys=Object.keys(counts).sort((a,b)=>(a==='mixed')-(b==='mixed')||(a==='local')-(b==='local')||counts[b]-counts[a]);
 const lg=$('legend');lg.replaceChildren();lg.classList.toggle('two-col',keys.length>6);
 for(const key of keys){const b=document.createElement('button');b.type='button';const dot=document.createElement('i');dot.style.background=swatch(key);b.append(dot,parties[key].name);
  const on=()=>{$('regions').classList.add('legend-focus');for(const r of regions)$('region-'+r.id).classList.toggle('legend-hit',control[index][r.id]===key)};
  const off=()=>$('regions').classList.remove('legend-focus');
  b.addEventListener('pointerenter',on);b.addEventListener('focus',on);b.addEventListener('pointerleave',off);b.addEventListener('blur',off);lg.appendChild(b)}}
function factionMarks(){$('factionNames').replaceChildren()}
const boxHit=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
function placeLabel(x,y,text,obstacles){const t=svgNode('text',{class:'city-label',x,y},$('cities'),text);
 const cands=[[13,-13,'start'],[14,5,'start'],[-14,5,'end'],[0,-18,'middle'],[0,30,'middle'],[-13,-13,'end'],[13,22,'start'],[-13,22,'end']];
 let best=cands[0],bestScore=1e9;
 for(const c of cands){t.setAttribute('x',x+c[0]);t.setAttribute('y',y+c[1]);t.setAttribute('text-anchor',c[2]);const b0=t.getBBox(),bb={x:b0.x-2,y:b0.y-2,width:b0.width+4,height:b0.height+4};const score=obstacles.filter(o=>boxHit(bb,o)).length;if(score<bestScore){best=c;bestScore=score}if(!score)break}
 t.setAttribute('x',x+best[0]);t.setAttribute('y',y+best[1]);t.setAttribute('text-anchor',best[2]);obstacles.push(t.getBBox());return t}
function drawRoutes(s){
 $('routes').replaceChildren();battleMark=null;
 $('cities').replaceChildren();
 const visible=[[],[],['博多'],[],['清洲','京都'],[],[],[],['大坂'],['大坂'],['博多'],['江戶'],['江戶','大坂'],['江戶']][index];
 const markers=[];if(s.battle)markers.push({x:s.battle[0]-10,y:s.battle[1]-11,width:20,height:22});const shown=cities.filter(c=>visible.includes(c.name));shown.forEach(c=>markers.push({x:c.x-4,y:c.y-4,width:8,height:8}));const obstacles=[...markers];for(const t of document.querySelectorAll('#regionNames text')){const bb=t.getBBox();const covered=!!bb.width&&markers.some(m=>boxHit(bb,m));t.classList.toggle('is-covered',covered);if(bb.width&&!covered)obstacles.push(bb)}shown.forEach(c=>svgNode('circle',{cx:c.x,cy:c.y,r:3,class:'city-point'},$('cities')));
 if(s.battle){const[x,y,label]=s.battle;battleMark=svgNode('g',{class:'battle',transform:`translate(${x} ${y})`},$('routes'));svgNode('circle',{cx:0,cy:0,r:17,class:'pulse-ring'},battleMark);svgNode('circle',{cx:0,cy:0,r:14,class:'impact-ring'},battleMark);svgNode('rect',{x:-10,y:-11,width:20,height:22,rx:2},battleMark);svgNode('text',{x:0,y:5},battleMark,index===7?'變':index===2?'傳':'戰')}
 drawMarches(obstacles,s.battle,shown);
}
function drawSpotlights(){const layer=$('spotlights');layer.replaceChildren();for(const id of focusRegions[index]){const r=regions.find(item=>item.id===id);svgNode('circle',{cx:r.label[0],cy:r.label[1],r:29,class:'spotlight-ring'},layer);svgNode('circle',{cx:r.label[0],cy:r.label[1],r:4,class:'spotlight-core'},layer)}updateFocus()}
function setStage(next){const changed=stage!==next;if(changed)stageTime=0;stage=next;const s=scenes[index],panel=document.querySelector('.map-panel');panel.dataset.phase=String(stage);$('guideText').textContent=[s.cause,s.summary,s.effect][stage];$('burstKicker').textContent=`${s.year} · ${['背景','事件','影響'][stage]}`;$('burstTitle').textContent=s.title;$('burstLine').textContent=storyBeats[index][stage];const burst=$('sceneBurst');burst.classList.remove('enter');void burst.offsetWidth;burst.classList.add('enter');if(typeof placeBurst==='function')placeBurst();document.querySelectorAll('.guide-steps span').forEach((step,i)=>step.classList.toggle('active',i===stage));['cause','summary','effect'].forEach((k,i)=>$(k).classList.toggle('is-speaking',playing&&i===stage));for(const r of regions)$('region-'+r.id).classList.toggle('story-focus',stage>0&&focusRegions[index].includes(r.id));renderGuideRoutes();updateMapMotion()}
/* updateMapMotion() 移到 map-motion.js */
function render(){const s=scenes[index];for(const k of ['year','era','title','summary','cause','effect'])$(k).textContent=s[k];$('eventNote').textContent=s.note;$('sceneTag').textContent=s.tag;$('sceneNumber').textContent=String(index+1).padStart(2,'0');$('mapPeriod').textContent=`${s.year} 年 · ${s.title}`;$('sceneCount').textContent=`第${chapterCN[index]}幕 / 十四幕`;$('sceneAnnounce').textContent=`第${index+1}幕，${s.year}年，${s.title}`;renderPeople(s);if(window.renderStory)renderStory(s.year);$('sourceLink').href=sources[s.source];$('sceneRange').value=index;$('sceneRange').setAttribute('aria-valuetext',`${s.year}年，${s.title}`);$('gapText').textContent=index?`距上一幕 ${s.year-scenes[index-1].year} 年`:'從 1467 年開始';applyTerritories();renderLegend();factionMarks();startPreview();drawRoutes(s);renderRouteList();drawSpotlights();setStage(0);document.querySelectorAll('.chapter').forEach((b,i)=>{b.classList.toggle('active',i===index);i===index?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current')});document.querySelectorAll('.scale-dot').forEach((b,i)=>b.classList.toggle('active',i===index));$('prev').disabled=index===0;$('next').disabled=index===scenes.length-1;$('theaterPrev').disabled=index===0;$('theaterNext').disabled=index===scenes.length-1;if(selectedRegion)inspect(selectedRegion);updatePlayUI()}
function stopNarration(){narrationToken++;utterance=null;narrationState='idle';if(canNarrate)window.speechSynthesis.cancel()}
function startNarration(){if(!canNarrate||speed!==1||!playing)return;stopNarration();const token=narrationToken,s=scenes[index],lines=[`${s.year}年，${s.title}。背景，${s.cause}`,`事件，${s.summary}`,`影響，${s.effect}`];function speak(part){if(token!==narrationToken||!playing)return;setStage(part);const u=new window.SpeechSynthesisUtterance(lines[part]);u.lang='zh-TW';u.rate=1;const voices=window.speechSynthesis.getVoices();u.voice=voices.find(v=>v.lang.toLowerCase()==='zh-tw')||voices.find(v=>v.lang.toLowerCase().startsWith('zh'))||null;u.onend=()=>{if(token!==narrationToken)return;utterance=null;if(part<2)speak(part+1);else{narrationState='finished';updatePlayUI()}};u.onerror=()=>{if(token!==narrationToken)return;utterance=null;narrationState='failed';updatePlayUI()};utterance=u;narrationState='speaking';try{window.speechSynthesis.speak(u)}catch{utterance=null;narrationState='failed'}updatePlayUI()}speak(0)}
function updatePlayUI(){$('playIcon').textContent=playing?'Ⅱ':'▶';$('playText').textContent=playing?'暫停播放':(index===13&&elapsed>=13000?'重新播放':speed===1?'播放並朗讀':'播放歷史');$('play').setAttribute('aria-label',playing?'暫停播放':speed===1?'播放並朗讀歷史':'播放歷史動畫');$('play').setAttribute('aria-pressed',String(playing));const panel=document.querySelector('.map-panel');panel.classList.toggle('is-paused',!playing);panel.classList.toggle('is-playing',playing);$('theaterPlay').textContent=playing?'Ⅱ 暫停':'▶ 播放';$('theaterPlay').setAttribute('aria-pressed',String(playing));$('theaterSpeed').value=String(speed);$('playStatus').textContent=playing?speed===1&&narrationState==='speaking'?`朗讀中 · 第 ${index+1} / 14 幕`:`第 ${index+1} / 14 幕`:speed===1?(canNarrate?'1 倍速會朗讀本幕內容':'此瀏覽器不支援語音朗讀'):`每幕約 ${13/speed} 秒`}
function go(i){stopNarration();index=Math.max(0,Math.min(scenes.length-1,i));elapsed=0;stageTime=0;lastTime=performance.now();$('playProgress').style.width='0%';render();if(playing)startNarration();const b=$('chapters').children[index];if(matchMedia('(max-width:760px)').matches)$('chapters').scrollTo({left:b.offsetLeft-$('chapters').offsetLeft-12,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})}
function togglePlay(){if(playing){playing=false;if(canNarrate&&utterance)window.speechSynthesis.pause()}else{if(index===13&&elapsed>=13000)go(0);playing=true;stopPreview();if(speed===1&&canNarrate){if(utterance&&narrationState==='speaking')window.speechSynthesis.resume();else if(narrationState==='idle')startNarration()}}lastTime=performance.now();updatePlayUI()}
$('play').addEventListener('click',togglePlay);$('prev').addEventListener('click',()=>go(index-1));$('next').addEventListener('click',()=>go(index+1));$('sceneRange').addEventListener('input',e=>go(Number(e.target.value)));$('speed').addEventListener('change',e=>{const previous=speed;speed=Number(e.target.value);if(previous===1&&speed!==1)stopNarration();else if(previous!==1&&speed===1&&playing){elapsed=0;stageTime=0;startNarration()}lastTime=performance.now();updatePlayUI()});
$('theaterToggle').addEventListener('click',()=>{const panel=document.querySelector('.map-panel'),open=panel.classList.toggle('theater');document.body.classList.toggle('theater-open',open);$('theaterToggle').textContent=open?'× 關閉動畫':'⛶ 放大動畫';$('theaterToggle').setAttribute('aria-label',open?'關閉全螢幕動畫':'開啟全螢幕動畫');$('theaterToggle').setAttribute('aria-expanded',String(open));if(open)$('theaterPlay').focus();else $('theaterToggle').focus();requestAnimationFrame(updateFocus)});
$('theaterPlay').addEventListener('click',togglePlay);$('theaterPrev').addEventListener('click',()=>go(index-1));$('theaterNext').addEventListener('click',()=>go(index+1));$('theaterSpeed').addEventListener('change',e=>{$('speed').value=e.target.value;$('speed').dispatchEvent(new Event('change'))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.map-panel.theater')){$('theaterToggle').click();e.preventDefault()}});
document.addEventListener('keydown',e=>{if($('about').open||e.altKey||e.ctrlKey||e.metaKey||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;if(e.code==='Space'&&(['BUTTON','A'].includes(e.target.tagName)||e.target.getAttribute('role')==='button'))return;if(e.code==='Space'){e.preventDefault();togglePlay()}else if(e.key==='ArrowRight'){e.preventDefault();go(index+1)}else if(e.key==='ArrowLeft'){e.preventDefault();go(index-1)}});
$('aboutBtn').addEventListener('click',()=>{playing=false;stopNarration();updatePlayUI();$('about').showModal()});$('closeAbout').addEventListener('click',()=>$('about').close());$('about').addEventListener('click',e=>{if(e.target===$('about')){const r=$('about').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('about').close()}});document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;stopNarration();updatePlayUI()}lastTime=performance.now()});
function tick(now){if(playing){const delta=Math.min(now-lastTime,200);elapsed+=delta*speed;stageTime+=delta;if(speed!==1||!canNarrate||narrationState==='failed'){const next=Math.min(2,Math.floor(Math.min(elapsed,12999)/(13000/3)));if(next!==stage)setStage(next)}updateMapMotion();if(elapsed>=13000&&narrationState!=='speaking'){if(index<scenes.length-1)go(index+1);else{elapsed=13000;playing=false;stopNarration();updatePlayUI()}}$('playProgress').style.width=(Math.min(elapsed,13000)/13000*100)+'%'}else if(previewRunning())updateMapMotion();lastTime=now;requestAnimationFrame(tick)}render();requestAnimationFrame(tick);
if(document.modelContext?.registerTool){const life=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:life.signal})).catch(()=>{})}catch{}};register({name:'read_sengoku_scene',title:'讀取戰國章節',description:'讀取目前章節與十四幕目錄。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute(){return{scene:index+1,year:scenes[index].year,title:scenes[index].title,playing,chapters:scenes.map((s,i)=>({scene:i+1,year:s.year,title:s.title}))}}});register({name:'navigate_sengoku_scene',title:'切換戰國章節',description:'切換至指定章節（1–14）並暫停，供閱讀。',inputSchema:{type:'object',properties:{scene:{type:'integer',minimum:1,maximum:14}},required:['scene'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||!Number.isInteger(input.scene)||input.scene<1||input.scene>14)throw new Error('scene 必須是 1 到 14 的整數');playing=false;go(input.scene-1);return{scene:index+1,year:scenes[index].year,title:scenes[index].title,playing}}});addEventListener('pagehide',()=>life.abort(),{once:true})}
