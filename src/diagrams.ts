// Versioned, generic teaching illustrations. Private workspace HTML stores only an ID.
export const diagrams = {
 'architecture-v1':{title:'Factory requests and robot responsibilities',description:'Factory systems and operators request work. A fleet service allocates and records missions. A robot controller executes local movement and equipment handshakes; its designed safety controls remain local. These are responsibilities, not mandatory separate computers.',labels:'MES WMS browser factory operator mission fleet manager robot controller equipment local edge physical machine process service instance'},
 'network-v1':{title:'Different roles in one HTTPS request',description:'For a new hostname-based HTTPS connection, DNS can resolve a name, IP and TCP reach a host and port, TLS protects the connection, and HTTP carries a request whose body may be JSON. Names and connections can be reused. An API is the interface; REST, gRPC and GraphQL describe different interface approaches.',labels:'DNS IP TCP port TLS HTTPS HTTP JSON API serialization request response endpoint hostname'},
 'single-host-v1':{title:'Related containers on one host',description:'The host is a physical or virtual machine. Docker Engine manages container execution. An image is the template used to create containers. Compose describes the application services, networks and volumes. Here only the manager owns the SQLite database volume; the simulator calls the manager API.',labels:'Docker Engine Compose host machine image container manager simulator network port volume SQLite'},
 'cluster-v1':{title:'A cluster contains nodes, Pods and containers',description:'A Kubernetes cluster has a control plane and worker nodes. A node hosts Pods, and a Pod holds one or more containers. The control plane reconciles declared resources. A Deployment maintains Pod replicas; a Service offers stable access to matching ready Pods. Helm installs parameterized resource sets; it does not execute containers. This example shows two API replicas, not two independent copies of the lab SQLite manager.',labels:'Kubernetes cluster control plane worker node Pod container replicas Deployment Service Helm chart values release runtime'},
 'messaging-v1':{title:'Independent subscribers and a worker group',description:'A publisher sends an event through a broker. An independent subscriber receives its copy; workers in one processing group share that group’s work. The details depend on the product. Delivery or processing can repeat after failures, so grouping does not remove the need for idempotency. Core NATS, JetStream and Kafka have different persistence and distribution semantics.',labels:'producer publisher broker event consumer subscriber queue group consumer group NATS JetStream Kafka topic partition offset acknowledgement replay'}
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
 if(id==='architecture-v1'){
  h=small?670:560;const x=small?30:160,bw=small?280:320;
  s+=box(x,20,bw,75,['Factory systems / operator','MES · WMS · browser']);
  s+=box(x,170,bw,80,['Fleet service','allocate · record · report']);s+=arrow(w/2,95,w/2,170,'requests');
  s+=box(x,335,bw,80,['Robot controller','local execution and state']);s+=arrow(w/2,250,w/2,335,'commands / reports');
  const end=small?550:490;s+=box(x,end,bw,65,['Robot / transfer equipment','physical work and signals']);s+=arrow(w/2,415,w/2,end,'equipment handshake');
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
 return {w,h,s};
}
let sequence=0;
export function diagramHTML(id:DiagramId){
 const d=diagrams[id],key='study-visual-'+ ++sequence;
 const svg=(small:boolean)=>{const {w,h,s}=art(id,small),uid=key+(small?'-small':'-wide');return `<svg class="${small?'diagram-narrow':'diagram-wide'}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="${uid}" xmlns="http://www.w3.org/2000/svg"><title id="${uid}">${esc(d.title)}</title>${s}</svg>`;};
 return `<figure class="study-diagram" data-rendered-diagram="${id}"><figcaption>${esc(d.title)}</figcaption>${svg(false)}${svg(true)}<p class="diagram-equivalent">${esc(d.description)}</p><p class="diagram-legend">Nested frames mean contains. Arrows are labelled with the relationship.</p></figure>`;
}
