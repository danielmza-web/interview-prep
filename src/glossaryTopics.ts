import type {GlossaryTerm} from './types';

// Presentation only: stable IDs keep grouping independent of edited labels.
const topics = [
 ['robots','Robotics and factory','amr agv agc cobot plc mission-id robot-id mission fleet-manager robot-controller localization handshake state-machine slam asrs mes wms conveyance hmi scada erp wcs ros-2 vda-5050 opc-ua mqtt lidar odometry path-planning docking payload interlock state-of-charge imu'],
 ['computing','Computers and programming','hardware operating-system process software-service instance host edge-computing source-code dependency build go c cpp parameter return-value boolean exception class pointer thread parallelism concurrency race-condition goroutine compilation virtual-machine program cpu ram ai'],
 ['networks','Networks and APIs','api endpoint dns ip-address port tcp udp tls http json authentication authorization timeout retry idempotency latency client-and-server contract scheme path localhost serialization resolver streaming subnet gateway firewall acl roaming connection-refused proxy upstream load-balancer rest grpc graphql identifier url https icmp ui uuid'],
 ['deployments','Containers and deployments','image container volume compose cluster node pod deployment kubernetes-service helm helm-chart helm-values helm-release replica stateless ci-cd rollback docker kubernetes canary rolling-update restart redeploy failover configuration dockerfile registry docker-engine container-runtime git-workflow backward-compatible readiness-probe liveness-probe startup-probe desired-state control-plane vertical-scaling horizontal-scaling high-availability namespace configmap secret persistentvolumeclaim selector crashloopbackoff feature-flag'],
 ['messages','Messaging and distributed systems','telemetry heartbeat state command event authoritative-source reconciliation cache consistency partial-failure starvation broker publish-subscribe subject topic partition offset consumer-group acknowledgement persistence backlog backpressure nats jetstream kafka retention replay producer consumer queue-group at-least-once at-most-once committed-offset'],
 ['data','SQL and databases','transaction index lock atomic schema sql relational-database row column primary-key foreign-key join connection-pool database-migration null'],
 ['observability','Metrics and observability','throughput utilization percentile log metric trace correlation-id availability mttr sli slo alert saturation clock-synchronization kpi utc confusion-matrix-counts'],
 ['incidents','Incidents and coordination','incident symptom hypothesis evidence triage incident-lead mitigation corrective-action escalation runbook rca teach-back acceptance-criteria'],
] as const;
export const glossaryTopics=topics.map(([id,title,ids])=>({id,title,ids:new Set(ids.split(' ').map(s=>'term-'+s))}));
export function glossaryTopic(term:GlossaryTerm){return glossaryTopics.find(t=>t.ids.has(term.id))?.id||'other';}
export function groupGlossary(terms:GlossaryTerm[]){
 return [...glossaryTopics,{id:'other',title:'Other concepts',ids:new Set<string>()}].map(t=>({id:t.id,title:t.title,terms:terms.filter(term=>glossaryTopic(term)===t.id).sort((a,b)=>a.term.localeCompare(b.term,'en',{sensitivity:'base'}))})).filter(t=>t.terms.length);
}
