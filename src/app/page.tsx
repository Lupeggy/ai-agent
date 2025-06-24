"use client"

import { useState } from "react";

import { authClient } from "@/lib/auth-client"; 
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export default function Home() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = () => {
    authClient.signUp.email({
      email,
      password,
      name,
    }, {
      onError: () => {
        window.alert('Failed to create user');
      },
      onSuccess: () => {
        window.alert('User created successfully');
      },
    });
  
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <Input 
        placeholder="name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} />
      <Input 
        placeholder="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} />
      <Input 
        placeholder="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} />

      <Button onClick={onSubmit}>Create User</Button>
    </div>
  );
}
