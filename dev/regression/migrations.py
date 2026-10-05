# Local disposable stack only. Requires simplification/adjustments fixtures.
import json,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]
import os
os.chdir(root)
state=json.load(open('/tmp/teron-regression-accounts.json'));ws=state['ws']['workspace'];owner=state['owner']['account'];user=state['user']['account']
def sql(q):
 return subprocess.check_output(['docker','compose','-f','dev/docker-compose.regression.yaml','exec','-T','postgres','psql','-U','postgres','-d','postgres','-At','-v','ON_ERROR_STOP=1','-c',q],text=True)
def literal(value): return "'"+str(value).replace("'","''")+"'"
w=literal(ws)
sql(f'''UPDATE task SET data=(data-'assignees') || '{{"assignee":"regression-account-user-person"}}'::jsonb WHERE "workspaceId"={w} AND _id='regression-parent-issue';
UPDATE task SET data=data-'assignees'-'assignee' WHERE "workspaceId"={w} AND _id='regression-child-issue';
INSERT INTO tracker ("workspaceId",_id,_class,space,"modifiedBy","modifiedOn",data) VALUES ({w},'regression-legacy-template','tracker:class:IssueTemplate','tracker:project:DefaultProject','{state['owner']['socialId']}',1,'{{"title":"Modelo legado","assignee":"regression-account-owner-person","children":[{{"title":"Filho legado","assignee":"regression-account-user-person","children":[{{"title":"Sem responsável"}}]}}]}}') ON CONFLICT ("workspaceId",_id) DO UPDATE SET data=EXCLUDED.data;
UPDATE space SET data=data-'guidelineAccess'-'guidelineReaders'-'guidelineEditors'-'guidelineReaderSectors'-'guidelineEditorSectors',members=ARRAY[{literal(owner)},{literal(user)}],private=true WHERE "workspaceId"={w} AND _id='regression-grant-teamspace';
DELETE FROM _migrations WHERE "workspaceId"={w} AND data->>'state' IN ('task-assignees-list','template-assignees-list','guideline-access-preserve-members');''')
cmd=['docker','compose','-f','dev/docker-compose.regression.yaml','run','--rm','--no-deps','--pull','never','-v',str(root/'dev/tool/bundle/bundle.js')+':/usr/src/app/tool.js:ro','-e','ACCOUNT_DB_URL=postgres://postgres:regression@postgres:5432/postgres','-e','TRANSACTOR_URL=ws://transactor:3333','-e','MONGO_URL=mongodb://127.0.0.1:27017','--entrypoint','node','workspace','/usr/src/app/tool.js','upgrade-workspace',ws]
def snapshot():
 tasks=[json.loads(v) for v in sql(f'''SELECT jsonb_build_object('id',_id,'data',data) FROM task WHERE "workspaceId"={w} AND _id IN ('regression-parent-issue','regression-child-issue') ORDER BY _id''').splitlines()]
 assert len(tasks)==2
 for t in tasks:
  assert 'assignee' not in t['data'];assert t['data']['assignees']==(['regression-account-user-person'] if t['id']=='regression-parent-issue' else [])
 template=json.loads(sql(f'''SELECT data FROM tracker WHERE "workspaceId"={w} AND _id='regression-legacy-template' '''));assert template['assignees']==['regression-account-owner-person'];assert 'assignee' not in template
 child=template['children'][0];assert child['assignees']==['regression-account-user-person'];assert 'assignee' not in child;assert child['children'][0]['assignees']==[]
 space=json.loads(sql(f'''SELECT jsonb_build_object('data',data,'private',private,'members',members) FROM space WHERE "workspaceId"={w} AND _id='regression-grant-teamspace' '''));assert space['private'];assert set(space['members'])=={owner,user};assert set(space['data']['guidelineEditors'])=={owner,user};assert space['data']['guidelineAccess']
 return [tasks,template,space]
subprocess.run(['docker','compose','-f','dev/docker-compose.regression.yaml','stop','transactor'],check=True)
try:
 first=None
 for i in range(2):
  with open(f'/tmp/teron-migration-regression-{i}.log','w') as log:subprocess.run(cmd,stdout=log,stderr=subprocess.STDOUT,check=True)
  current=snapshot()
  if first is None:first=current
  else:assert current==first
 print('PASS actual legacy task/template/private grant migration repeated twice')
finally:subprocess.run(['docker','compose','-f','dev/docker-compose.regression.yaml','start','transactor'],check=True)
