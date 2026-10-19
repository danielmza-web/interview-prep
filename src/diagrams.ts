// Versioned, generic teaching illustrations. Private workspace HTML stores only an ID.
export const diagrams = {
 'mission-flow-v1':{title:'A delivery request: messages and the program that handles them',description:'An operator or factory system sends a request to the fleet application API. The host frame contains the running program, which may be a native process or a container, in a Pod when Kubernetes is used. The application validates and records a mission, offers a command through the agreed robot interface and receives status or acknowledgements. Local robot and station checks govern the physical transfer; the fleet application records the confirmed outcome for the dashboard. In Fleet-Lab, the simulator polls for commands and posts telemetry; physical work is simulated.',labels:'operator factory request API HTTP JSON fleet manager host native process container Pod command controller simulator polling telemetry acknowledgement physical transfer confirmation dashboard'},
 'release-flow-v1':{title:'A code change becomes a running application version',description:'Code changes are reviewed and tested. A build produces a versioned image that is published to a registry. The deployment configuration selects that image for the chosen component. Compose on a host and Kubernetes resources are alternative execution paths; Helm can package the Kubernetes configuration. The target runtime starts new application containers, in Pods for Kubernetes, and the team verifies health and a representative mission. This central-service rollout does not automatically update onboard robot software or mean one replica per robot.',labels:'Git code CI CD build Dockerfile versioned image registry Compose Kubernetes Helm runtime Pod replicas deployment central service robot onboard software verification'},
 'architecture-v1':{title:'Factory requests and robot responsibilities',description:'Factory systems and operators request work. A fleet service allocates and records missions. A robot controller executes local movement and equipment handshakes; its designed safety controls remain local. These are responsibilities, not mandatory separate computers.',labels:'MES WMS browser factory operator mission fleet manager robot controller equipment local edge physical machine process service instance'},
 'network-v1':{title:'Different roles in one HTTPS request',description:'For a new hostname-based HTTPS connection, DNS can resolve a name, IP and TCP reach a host and port, TLS protects the connection, and HTTP carries a request whose body may be JSON. Names and connections can be reused. An API is the interface; REST, gRPC and GraphQL describe different interface approaches.',labels:'DNS IP TCP port TLS HTTPS HTTP JSON API serialization request response endpoint hostname'},
 'single-host-v1':{title:'Related containers on one host',description:'The host is a physical or virtual machine. Docker Engine manages container execution. An image is the template used to create containers. Compose describes the application services, networks and volumes. Here only the manager owns the SQLite database volume; the simulator calls the manager API.',labels:'Docker Engine Compose host machine image container manager simulator network port volume SQLite'},
 'cluster-v1':{title:'A cluster contains nodes, Pods and containers',description:'A Kubernetes cluster has a control plane and worker nodes. A node hosts Pods, and a Pod holds one or more containers. The control plane reconciles declared resources. A Deployment maintains Pod replicas; a Service offers stable access to matching ready Pods. Helm installs parameterized resource sets; it does not execute containers. This example shows two API replicas, not two independent copies of the lab SQLite manager.',labels:'Kubernetes cluster control plane worker node Pod container replicas Deployment Service Helm chart values release runtime'},
 'messaging-v1':{title:'Independent subscribers and a worker group',description:'A publisher sends an event through a broker. An independent subscriber receives its copy; workers in one processing group share that group’s work. The details depend on the product. Delivery or processing can repeat after failures, so grouping does not remove the need for idempotency. Core NATS, JetStream and Kafka have different persistence and distribution semantics.',labels:'producer publisher broker event consumer subscriber queue group consumer group NATS JetStream Kafka topic partition offset acknowledgement replay'},
 'mission-lifecycle-v1':{title:'One mission, five different confirmations',description:'A factory request is accepted and recorded as the illustrative mission M-105. The manager reserves the illustrative robot AMR-01. Robot receipt confirms a command reached its recipient, not delivery. Agreed equipment and robot evidence confirms transfer and allows recorded completion. These are conceptual checkpoints, not a promise that every API uses these exact state labels.',labels:'M-105 M-101 M-106 AMR-01 mission ID robot ID accepted assigned command receipt acknowledgement completed transfer ownership'},
 'rollout-v1':{title:'Rolling update and canary answer different questions',description:'A rolling update progressively replaces workload instances. A canary exposes an agreed limited scope to a new version, observes actual workflow and metrics, then expands, pauses or recovers. A real release can combine these ideas. Any percentages are illustrative: replica counts do not automatically establish exact traffic shares. Software recovery cannot automatically undo physical work or incompatible data changes.',labels:'canary rolling update limited rollout stable new version acceptance verification rollback redeploy restart'},
 'message-recovery-v1':{title:'A disconnected consumer: compare three alternatives',description:'For ordinary Core NATS, an absent subscriber misses the published event and receives future updates after reconnecting. JetStream can retain matching events and deliver or replay them through an appropriately configured consumer. Kafka can retain topic-partition records and resume a group from a valid position. Storage, retention limits, progress and duplicate handling matter in both retained cases. This is a comparison of alternatives, not three sequential processing steps.',labels:'Core NATS NATS JetStream Kafka disconnect reconnect retention replay consumer offset acknowledgement duplicate event history'}
} as const;
export type DiagramId=keyof typeof diagrams;
export function isDiagramId(id:unknown):id is DiagramId{return typeof id==='string'&&Object.hasOwn(diagrams,id);}
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function diagramText(id:DiagramId){const d=diagrams[id];return `${d.title}. ${d.description} ${d.labels}`;}
export function diagramPlaceholder(id:DiagramId){return `<div data-study-diagram="${id}"><p>${esc(diagrams[id].title)}. ${esc(diagrams[id].description)}</p></div>`;}
function box(x:number,y:number,w:number,h:number,lines:string[],frame=false){return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" class="${frame?'diagram-frame':'diagram-box'}"/>`+lines.map((s,i)=>`<text x="${x+w/2}" y="${frame?y+27:y+h/2-(lines.length-1)*10+5+i*20}" text-anchor="middle" class="diagram-text">${esc(s)}</text>`).join('');}
function arrow(x1:number,y1:number,x2:number,y2:number,label='',dashed=false){const angle=Math.atan2(y2-y1,x2-x1),s=7;const p=(a:number,b:number)=>`${a.toFixed(1)},${b.toFixed(1)}`;return `<path d="M${x1},${y1} L${x2},${y2}" class="diagram-arrow" ${dashed?'stroke-dasharray="5 4"':''}/><polygon points="${p(x2,y2)} ${p(x2-s*Math.cos(angle-.45),y2-s*Math.sin(angle-.45))} ${p(x2-s*Math.cos(angle+.45),y2-s*Math.sin(angle+.45))}" class="diagram-tip"/>`+(label?`<text x="${(x1+x2)/2+9}" y="${(y1+y2)/2-8}" class="diagram-link-label">${esc(label)}</text>`:'');}
function art(id:DiagramId,small:boolean){
 const w=small?340:640;let h=0,s='';
 if(id==='mission-flow-v1'){
  h=765;const x=small?20:100,bw=w-2*x,c=w/2;
  s+=box(x,15,bw,60,['Operator / factory system','requests a delivery']);
  s+=box(x,130,bw,210,['Fleet application host'],true);
  s+=`<text x="${c}" y="180" text-anchor="middle" class="diagram-link-label">Process OR container / Pod</text>`;
  s+=box(x+15,200,bw-30,45,['API: request handler']);
  s+=box(x+15,290,bw-30,35,['Mission record + dispatch']);
  s+=arrow(c,75,c,130,'HTTP / JSON');s+=arrow(c,245,c,290,'validate / store');
  s+=box(x,405,bw,70,['Robot-side controller','or lab simulator']);s+=arrow(c,340,c,405,'command interface');
  s+=box(x,540,bw,65,['Pickup / delivery','local transfer confirmation']);s+=arrow(c,475,c,540,'local actions / checks');
  s+=box(x,670,bw,65,['Fleet records + dashboard','confirmed outcome and state']);s+=arrow(c,605,c,670,'status / confirmations');
 }
 if(id==='release-flow-v1'){
  h=930;const x=small?20:100,bw=w-2*x,c=w/2;
  const items=[['Git: code change','review the change'],['CI: tests + image build','Dockerfile + dependencies'],['Registry: versioned image','publish the artifact'],['Choose an execution path','Compose OR Kubernetes','Helm optional for Kubernetes']];
  items.forEach((lines,i)=>{const y=15+i*125;s+=box(x,y,bw,i===3?90:70,lines);if(i<3)s+=arrow(c,y+70,c,y+125,i===1?'publish image':i===2?'select image':'check / build');});
  s+=box(x,555,bw,155,['Target host / cluster'],true);s+=box(x+15,615,bw-30,65,['New application containers','Pods if Kubernetes']);s+=arrow(c,480,c,555,'apply configuration');
  s+=box(x,785,bw,70,['Verify health + one mission','expand, pause or recover']);s+=arrow(c,710,c,785,'check behaviour');
  s+=`<text x="${c}" y="900" text-anchor="middle" class="diagram-link-label">Central rollout ≠ onboard robot update</text>`;
 }
 if(id==='architecture-v1'){
  h=small?670:560;const x=small?30:160,bw=small?280:320;
  s+=box(x,20,bw,75,['Factory systems / operator','MES · WMS · browser']);
  s+=box(x,170,bw,80,['Fleet service','allocate · record · report']);s+=arrow(w/2,95,w/2,170,'requests');
  s+=box(x,335,bw,80,['Robot controller','local execution and state']);s+=arrow(w/2,250,w/2,335,'commands / reports');s+=arrow(w/2,335,w/2,250);
  const end=small?550:490;s+=box(x,end,bw,65,['Robot / transfer equipment','physical work and signals']);s+=arrow(w/2,415,w/2,end,'equipment handshake');s+=arrow(w/2,end,w/2,415);
 }
 if(id==='network-v1'){
  h=610;const x=small?20:120,bw=small?300:400;
  [['DNS','hostname → IP address'],['IP + TCP','reachable host and port'],['TLS','protected connection'],['HTTP request','headers + body, e.g. JSON']].forEach((lines,i)=>{const y=20+i*150;s+=box(x,y,bw,90,lines);if(i<3)s+=arrow(w/2,y+90,w/2,y+150,'enables');});
  s+=`<text x="${w/2}" y="585" text-anchor="middle" class="diagram-text">Server returns an HTTP response</text>`;
 }
 if(id==='single-host-v1'){
  h=small?725:640;const x=small?15:20,bw=w-2*x;
  s+=box(x,15,bw,65,['Compose: describes the application','services · networks · volumes']);
  s+=box(x,160,bw,h-180,['Host: physical or virtual machine'],true);s+=arrow(w/2,80,w/2,160,'runs services on');
  s+=box(x+20,220,bw-40,65,['Docker Engine','manages container execution']);
  const y=small?355:350,cw=small?130:240,left=x+15,right=w-x-cw-15;
  s+=box(left,y,cw,100,['Manager','container','API + SQLite']);s+=box(right,y,cw,100,['Simulator','container','calls API']);
  s+=arrow(w/2,285,left+cw/2,y,'starts');s+=arrow(w/2,285,right+cw/2,y,'starts');
  const vy=small?575:520;s+=box(x+25,vy,bw-50,65,['Persistent volume','manager owns database']);s+=arrow(left+cw/2,y+100,left+cw/2,vy,'stores');
  s+=`<text x="${w/2}" y="${small?530:490}" text-anchor="middle" class="diagram-text">Image = reusable container template</text>`;
 }
 if(id==='cluster-v1'){
  h=small?1090:670;const x=small?12:20,bw=w-2*x;
  s+=box(x+10,15,bw-20,65,['Helm: chart + values','installs a release of resources']);
  s+=box(x,140,bw,h-160,['Kubernetes cluster'],true);
  s+=box(x+30,205,bw-60,75,['Control plane','reconciles declared resources']);s+=arrow(w/2,80,w/2,140,'applies resources');
  const nodes=small?[{x:30,y:360,w:280},{x:30,y:720,w:280}]:[{x:40,y:365,w:260},{x:340,y:365,w:260}];
  nodes.forEach((n,i)=>{s+=box(n.x,n.y,n.w,280,[`Node ${i+1}: worker machine`],true);s+=box(n.x+18,n.y+65,n.w-36,185,['Pod: workload unit'],true);s+=box(n.x+35,n.y+130,n.w-70,85,['Container','API replica '+(i+1)]);});
  if(small){s+=arrow(170,280,170,360,'schedules / maintains');s+='<path d="M170,280 H20 V690 H170" class="diagram-arrow"/>';s+=arrow(170,690,170,720,'');}else{nodes.forEach(n=>s+=arrow(320,280,n.x+n.w/2,365,'manages'));}
 }
 if(id==='messaging-v1'){
  h=small?850:650;const x=small?35:180,bw=small?270:280;
  s+=box(x,15,bw,65,['Publisher','MissionCompleted event']);s+=box(x,155,bw,65,['Broker','routes / retains as configured']);s+=arrow(w/2,80,w/2,155,'publishes');
  if(small){s+=box(35,320,270,75,['Independent subscriber','dashboard gets its copy']);s+=arrow(170,220,170,320,'copy');s+=box(15,495,310,310,['One processing group'],true);s+=arrow(170,395,170,495,'group receives a copy');s+=box(40,570,260,75,['Worker A']);s+=box(40,695,260,75,['Worker B']);s+=`<text x="170" y="675" text-anchor="middle" class="diagram-text">one worker per delivery</text>`;}
  else{s+=box(20,370,230,90,['Independent subscriber','dashboard copy']);s+=box(300,320,320,290,['One processing group'],true);s+=box(320,390,280,70,['Worker A']);s+=box(320,510,280,70,['Worker B']);s+=arrow(250,220,135,370,'copy');s+=arrow(390,220,460,320,'group copy');s+=`<text x="460" y="493" text-anchor="middle" class="diagram-text">one worker per delivery</text>`;}
 }
 if(id==='mission-lifecycle-v1'){
  const steps=[['Request','factory asks'],['Accepted','M-105','recorded'],['Assigned','AMR-01','reserved'],['Received','robot','confirms'],['Completed','transfer','confirmed']];
  h=small?710:330;
  const mobile=[['Request','Factory system asks'],['Accepted','M-105 recorded','Fleet manager'],['Assigned','AMR-01 reserved','Fleet manager'],['Received','Robot confirms receipt'],['Completed','Robot / equipment','confirm transfer']];
  steps.forEach((lines,i)=>{const x=small?25:10+i*126,y=small?20+i*135:60,bw=small?290:110;s+=box(x,y,bw,90,small?mobile[i]:lines);if(i<4)s+=small?arrow(170,y+90,170,y+135):arrow(x+bw,y+45,x+126,y+45);});
  if(!small){[['Factory','requester'],['Fleet','manager'],['Fleet','manager'],['Robot','controller'],['Robot and','equipment']].forEach((lines,i)=>s+=box(10+i*126,205,110,70,lines));}
 }
 if(id==='rollout-v1'){
  h=small?1120:640;const left=small?25:20,right=small?25:345,bw=small?290:275,cy=small?610:100;
  s+=`<text x="${left+bw/2}" y="40" text-anchor="middle" class="diagram-text">Rolling update</text>`;
  [['Old version instances'],['Old + new instances'],['New version instances']].forEach((lines,i)=>{const y=100+i*145;s+=box(left,y,bw,75,lines);if(i<2)s+=arrow(left+bw/2,y+75,left+bw/2,y+145,'replace gradually');});
  s+=`<text x="${right+bw/2}" y="${small?555:40}" text-anchor="middle" class="diagram-text">Canary / limited scope</text>`;
  [['Stable + limited new scope'],['Verify workflow and metrics'],['Expand, pause or recover']].forEach((lines,i)=>{const y=cy+i*145;s+=box(right,y,bw,75,lines);if(i<2)s+=arrow(right+bw/2,y+75,right+bw/2,y+145,i?'decide':'observe');});
  s+=`<text x="${w/2}" y="${h-35}" text-anchor="middle" class="diagram-text">Scope is not an automatic replica ratio</text>`;
 }
 if(id==='message-recovery-v1'){
  h=small?780:440;s+=box(small?20:160,15,small?300:320,80,['Consumer disconnects','An event is published']);
  const cards=[['Core NATS','Ordinary live delivery','Absent: event missed','Reconnect: new events'],['JetStream','Stored if configured','Catch up via consumer','Check retention / acks'],['Kafka','Retained log records','Resume valid offsets','Check retention / keys']];
  cards.forEach((lines,i)=>{const x=small?25:15+i*210,y=small?165+i*200:180,bw=small?290:190;s+=box(x,y,bw,150,lines);if(!small)s+=arrow(320,95,x+bw/2,y,'');});
  s+=`<text x="${w/2}" y="${h-30}" text-anchor="middle" class="diagram-text">${small?'Protect repeated effects':'Compare alternatives; protect repeated effects'}</text>`;
 }
 return {w,h,s};
}
export function diagramHTML(id:DiagramId){
 const d=diagrams[id];
 const svg=(small:boolean)=>{const {w,h,s}=art(id,small);return `<svg class="${small?'diagram-narrow':'diagram-wide'}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(d.title)}" xmlns="http://www.w3.org/2000/svg"><title>${esc(d.title)}</title>${s}</svg>`;};
 const legend=id==='mission-flow-v1'?'The host frame contains running code. Arrows show messages or actions, not a chain through Docker and Pods.':id==='release-flow-v1'?'Arrows show artifact and release actions. Compose and Kubernetes are alternatives; robot onboard updates are separate.':id==='mission-lifecycle-v1'?'Arrows show the next confirmation; the boxes do not represent elapsed time.':id==='rollout-v1'?'Arrows describe release steps. The two strategies can be combined.':id==='message-recovery-v1'?'The three product cards are alternatives under the same disconnect scenario.':'Nested frames mean contains. Arrows are labelled with the relationship.';
 return `<figure class="study-diagram" data-rendered-diagram="${id}"><figcaption>${esc(d.title)}</figcaption>${svg(false)}${svg(true)}<p class="diagram-equivalent">${esc(d.description)}</p><p class="diagram-legend">${legend}</p></figure>`;
}
