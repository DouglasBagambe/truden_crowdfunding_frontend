import React from 'react';
import { motion } from 'framer-motion';

interface ProjectCardProps {
  title: string;
  description: string;
  raised: number;
  target: number;
  featured?: boolean;
  onClick?: () => void;
}

const ProjectCard = ({ title, description, raised, target, featured, onClick }: ProjectCardProps) => {
  const percentage = Math.min(Math.round((raised / target) * 100), 100);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      onClick={onClick}
      className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer ${featured ? 'w-[300px] shrink-0' : ''}`}
    >
      <div className="w-full h-40 bg-gray-100 rounded-3xl mb-6 flex items-center justify-center overflow-hidden">
        {/* Placeholder for project image */}
        <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-200" />
      </div>

      <h3 className="font-bold text-gray-900 mb-2 truncate">{title}</h3>
      <p className="text-sm text-gray-500 line-clamp-2 mb-6">
        {description}
      </p>

      <div className="space-y-4">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            className="h-full bg-green-500 rounded-full"
          />
        </div>
        
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-gray-900">${raised.toLocaleString()}</span>
          <span className="text-gray-400">{percentage}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
