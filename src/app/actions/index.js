"use server"
import { signIn, signOut } from "@/auth"

export  async function doSocialLogin(formData) {
    const action = formData.get('action')
   await signIn(action, {redirectTo:"/"})
}

export async function doLogout(){
    await signOut ({redirectTo : "/"})
}

export async function loginUser(email, password) {
    const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
    });
    return await res.json();
}

export async function logoutUser() {
    await fetch("http://localhost:5000/api/auth/logout", { credentials: "include" });
    window.location.href = "/signin";
}
