import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#FFFDF7] text-[#526675] py-8 border-t border-[#D8E2DF] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          {/* Brand Info */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#237B8C] text-white flex items-center justify-center shadow-xs">
              <i className="fa-solid fa-droplet text-base"></i>
            </div>
            <div>
              <span className="text-base font-bold text-[#233746]">
                Blood<span className="text-[#237B8C]">Connect</span>
              </span>
              <p className="text-xs text-[#526675]">
                Intelligent blood dispatch and verified emergency donor network across Tamil Nadu.
              </p>
            </div>
          </div>

          {/* Copyright & Live DB status */}
          <div className="text-xs text-[#526675] space-y-1">
            <div>
              &copy; {new Date().getFullYear()} BloodConnect Emergency Network. All rights reserved.
            </div>
            <div className="text-[11px] text-[#237B8C] font-semibold flex items-center justify-center md:justify-end">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] mr-1.5 animate-pulse"></span>
              Live MongoDB Atlas Grid · Tamil Nadu
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
