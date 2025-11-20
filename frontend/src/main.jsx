// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import MenuCoffee from './pages/MenuCoffee';
import MenuOrder from './pages/MenuOrder';
import UsagePage from './pages/UsagePage';
import PayChoice from './pages/PayChoice';
import PayProcess from './pages/PayProcess';
import CompletePage from './pages/CompletePage';
import MenuOrder_voice from './pages/MenuOrder_voice';
import UsagePage_voice from './pages/UsagePage_voice'; 
import PayChoice_voice from './pages/PayChoice_voice';
import PayProcess_voice from './pages/PayProcess_voice';
import Complete_voice from './pages/Complete_voice'; 

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu_coffee" element={<MenuCoffee />} />
         <Route path="/order" element={<MenuOrder />} />
         <Route path="/usage" element={<UsagePage />} />
          <Route path="/paychoice" element={<PayChoice />} /> 
          <Route path="/payprocess" element={<PayProcess />} />
          <Route path="/complete" element={<CompletePage />} />
          <Route path="/order_voice" element={<MenuOrder_voice />} />
           <Route path="/usage_voice" element={<UsagePage_voice />} />
           <Route path="/payprocess_voice" element={<PayProcess_voice />} />
           <Route path="/paychoice_voice" element={<PayChoice_voice />}
           
            
           />
           <Route path="/complete_voice" element={<Complete_voice />} />
           
      </Routes>
    </BrowserRouter>

);
