import React, { useState } from "react";
import { Plus, PenTool, Link as LinkIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AddRecipeMenu({ onManual, onImport, onPhoto }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#FF6B35] hover:bg-[#FF8555] text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add Recipe
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1A2744] border-[#243352] w-56">
        <DropdownMenuItem
          onClick={onManual}
          className="text-[#F5F5F0] hover:bg-[#243352] cursor-pointer py-3"
        >
          <PenTool className="w-4 h-4 mr-2 text-[#FF6B35]" />
          Add Recipe Manually
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onImport}
          className="text-[#F5F5F0] hover:bg-[#243352] cursor-pointer py-3"
        >
          <LinkIcon className="w-4 h-4 mr-2 text-[#FF6B35]" />
          Import from URL/Text
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onPhoto}
          className="text-[#F5F5F0] hover:bg-[#243352] cursor-pointer py-3"
        >
          <Camera className="w-4 h-4 mr-2 text-[#FF6B35]" />
          Convert from Photo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}