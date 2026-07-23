import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";

export const ADMIN_EMAILS = ["sandeep.chinamanagonda@woxza.io", "prathyusha.kommuru@woxza.io", "hemanth_khande@woxza.io"];
const cookieValue = (req, name) => Object.fromEntries(String(req.headers.cookie || "").split(";").map(part => part.trim().split(/=(.*)/s, 2)).filter(([key]) => key))[name];
const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const decode = value => JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
const signature = (value, secret) => createHmac("sha256", secret).update(value).digest("base64url");
export function sessionFor(req, secret) { const raw=cookieValue(req,"woxza_admin_session"); if(!secret||!raw)return null; const [body,provided]=raw.split("."); const expected=body&&signature(body,secret); if(!body||!provided||provided.length!==expected.length||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected)))return null; try { const session=decode(body); return session?.exp>Date.now()&&ADMIN_EMAILS.includes(session.email)?session:null } catch { return null } }
export function sessionCookie(user, secret, secure) { const body=encode({id:user.id,email:user.email,exp:Date.now()+43200000}); return `woxza_admin_session=${body}.${signature(body,secret)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure?"; Secure":""}` }
export const clearSessionCookie = secure => `woxza_admin_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?"; Secure":""}`;
export async function seedAdminUsers(db, initialPassword=process.env.ADMIN_INITIAL_PASSWORD) { if(!initialPassword)return; if(initialPassword.length<8)throw new Error("ADMIN_INITIAL_PASSWORD must be at least 8 characters"); const hash=await bcrypt.hash(initialPassword,12); for(const email of ADMIN_EMAILS)await db.query("INSERT INTO admin_users (id,email,password_hash) VALUES ($1,$2,$3) ON CONFLICT (email) DO NOTHING",[randomUUID(),email,hash]); }
export async function authenticateAdmin(db,email,password) { const normalized=String(email||"").trim().toLowerCase(); if(!ADMIN_EMAILS.includes(normalized)||typeof password!=="string")return null; const result=await db.query("SELECT id,email,password_hash FROM admin_users WHERE email=$1",[normalized]); const user=result.rows[0]; if(!user||!(await bcrypt.compare(password,user.password_hash)))return null; await db.query("UPDATE admin_users SET last_login_at=NOW() WHERE id=$1",[user.id]); return user; }
