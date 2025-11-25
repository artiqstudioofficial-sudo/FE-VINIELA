import{u as c,r as o,j as e}from"./index-_EZrd0Hu.js";const x=()=>{const{t:s}=c();o.useEffect(()=>{window.scrollTo(0,0)},[]);const{title:t,lastUpdated:i,introduction:n,sections:r}=s.privacyPolicy;return e.jsxs("div",{className:"bg-white animate-fade-in-up",children:[e.jsx("header",{className:"bg-viniela-dark text-white py-16",children:e.jsxs("div",{className:"container mx-auto px-6 text-center",children:[e.jsx("h1",{className:"text-4xl md:text-5xl font-extrabold",children:t}),e.jsx("p",{className:"mt-2 text-lg text-gray-300",children:i})]})}),e.jsx("main",{className:"py-20",children:e.jsx("div",{className:"container mx-auto px-6 max-w-4xl",children:e.jsxs("div",{className:"prose prose-lg max-w-none text-viniela-gray",children:[e.jsx("p",{className:"lead",children:n}),r.map((a,l)=>e.jsxs("div",{className:"mt-8",children:[e.jsx("h2",{className:"!text-viniela-dark !mb-3",children:a.title}),e.jsx("div",{dangerouslySetInnerHTML:{__html:a.content}})]},l))]})})}),e.jsx("style",{children:`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { 
                    animation: fade-in-up 0.6s ease-out forwards; 
                }
                .prose ul > li::before {
                    background-color: #c09a58;
                }
            `})]})};export{x as default};
