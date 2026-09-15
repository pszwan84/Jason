import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
export function sqlite(path:string):D1Database {
 if(path!==':memory:')mkdirSync(dirname(path),{recursive:true});
 const native=new DatabaseSync(path);native.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');
 native.exec(readFileSync(new URL('../../migrations/0001_platform.sql',import.meta.url),'utf8'));
 class Statement {
  sql:string; args:(string|number|null)[]=[];
  constructor(sql:string){this.sql=sql;}
  bind(...args:(string|number|null)[]){this.args=args;return this;}
  async first(){return native.prepare(this.sql).get(...this.args)||null;}
  async all(){return {results:native.prepare(this.sql).all(...this.args),success:true};}
  async run(){return this.sync();}
  sync(){const r=native.prepare(this.sql).run(...this.args);return {success:true,meta:{changes:Number(r.changes)}};}
 }
 return {prepare:(sql:string)=>new Statement(sql),batch:async(statements:Statement[])=>{
  native.exec('BEGIN IMMEDIATE');try{const results=statements.map(s=>s.sync());native.exec('COMMIT');return results;}catch(e){native.exec('ROLLBACK');throw e;}
 }} as unknown as D1Database;
}
