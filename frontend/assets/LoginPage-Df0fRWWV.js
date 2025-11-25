import{u as b,b as g,c as w,r as t,j as e}from"./index-_EZrd0Hu.js";const j=()=>{var c,u;const{t:a}=b(),o=g(),n=((u=(c=w().state)==null?void 0:c.from)==null?void 0:u.pathname)||"/admin",[i,p]=t.useState(""),[l,f]=t.useState(""),[r,x]=t.useState(!1),[d,m]=t.useState("");t.useEffect(()=>{sessionStorage.getItem("viniela-auth")==="true"&&o(n,{replace:!0})},[o,n]);const h=s=>{s.preventDefault(),m(""),i==="admin"&&l==="password"?(sessionStorage.setItem("viniela-auth","true"),o(n,{replace:!0})):m(a.login.errorMessage)};return e.jsxs("div",{className:"flex items-center justify-center min-h-[70vh] bg-viniela-silver p-4",children:[e.jsxs("div",{className:"w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg m-4 animate-fade-in-up",children:[e.jsx("h1",{className:"text-3xl font-bold text-center text-viniela-dark",children:a.login.title}),e.jsxs("form",{onSubmit:h,className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("label",{className:"form-label",children:a.login.username}),e.jsx("input",{type:"text",value:i,onChange:s=>p(s.target.value),className:"form-input",required:!0,autoComplete:"username"})]}),e.jsxs("div",{children:[e.jsx("label",{className:"form-label",children:a.login.password}),e.jsxs("div",{className:"relative",children:[e.jsx("input",{type:r?"text":"password",value:l,onChange:s=>f(s.target.value),className:"form-input pr-10",required:!0,autoComplete:"current-password"}),e.jsx("button",{type:"button",onClick:()=>x(!r),className:"absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-viniela-dark transition-colors duration-200","aria-label":r?a.login.hidePassword:a.login.showPassword,children:e.jsx("i",{className:`fa-solid ${r?"fa-eye-slash":"fa-eye"}`,"aria-hidden":"true"})})]})]}),d&&e.jsx("p",{className:"text-sm text-center text-red-600 animate-shake",children:d}),e.jsx("div",{children:e.jsx("button",{type:"submit",className:"w-full btn-primary",children:a.login.loginButton})})]})]}),e.jsx("style",{children:`
          .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500; color: #4d4d4d; }
          .form-input { display: block; width: 100%; border-radius: 0.5rem; border: 1px solid #d1d5db; padding: 0.75rem 1rem; transition: border-color 0.2s, box-shadow 0.2s; }
          .form-input:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #c09a58; box-shadow: 0 0 0 2px #c09a58; }
          .btn-primary { padding: 0.75rem 1.5rem; background-color: #c09a58; color: white; border-radius: 0.5rem; font-weight: 600; transition: background-color 0.2s, transform 0.2s; border: none; cursor: pointer; }
          .btn-primary:hover { background-color: #b08b49; transform: translateY(-1px); }
          @keyframes fade-in-up {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
      `})]})};export{j as default};
