import Project from '../models/Project.js';
import ProjectDetails from '../models/ProjectDetails.js';
import User from '../models/User.js';
import Sensor from '../models/Sensor.js';

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    let query = {};

    // Admin can see all projects
    if (req.user.role === 'admin') {
      // If email filter is provided
      if (req.query.email) {
        query.ownerEmail = req.query.email;
      }
    } else {
      // Get user's assigned projects
      const user = await User.findById(req.user._id).select('assignedProjects');
      
      // Regular users see only their assigned projects, owned projects, or projects they're team members of
      query.$or = [
        { owner: req.user._id },
        { ownerEmail: req.user.email },
        { 'teamMembers.user': req.user._id },
      ];
      
      // Add assigned projects to the query
      if (user && user.assignedProjects && user.assignedProjects.length > 0) {
        query.$or.push({ _id: { $in: user.assignedProjects } });
      }
    }

    // Add status filter if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Add active filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    const projects = await Project.find(query)
      .populate('owner', 'fullName email')
      .populate('teamMembers.user', 'fullName email role')
      .populate('sensors')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'fullName email phoneNumber')
      .populate('teamMembers.user', 'fullName email role')
      .populate('sensors');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check authorization
    const isOwner = project.owner._id.toString() === req.user._id.toString();
    const isTeamMember = project.teamMembers.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );
    const isAdmin = req.user.role === 'admin';
    
    // Check if user has this project in their assignedProjects
    const user = await User.findById(req.user._id).select('assignedProjects');
    const isAssigned = user?.assignedProjects?.some(
      (projectId) => projectId.toString() === req.params.id
    );

    if (!isOwner && !isTeamMember && !isAdmin && !isAssigned) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    // Add user as owner
    req.body.owner = req.user._id;
    req.body.ownerEmail = req.user.email;

    const project = await Project.create(req.body);

    // Create corresponding ProjectDetails entry for seamless integration
    try {
      const projectDetailsData = {
        project_id: project._id.toString(),
        project_title: req.body.projectName || '',
        structure_type: req.body.projectType || 'building',
        construction_date: req.body.startDate || null,
        area: req.body.location?.address || req.body.address?.area || '',
        city: req.body.location?.city || req.body.address?.city || '',
        country: req.body.location?.country || req.body.address?.country || 'India',
        latitude: req.body.location?.coordinates?.latitude || req.body.coordinates?.latitude || null,
        longitude: req.body.location?.coordinates?.longitude || req.body.coordinates?.longitude || null,
        updated_by: req.user.email
      };

      await ProjectDetails.create(projectDetailsData);
      console.log('[Project] ProjectDetails created automatically for new project:', project.projectId);
    } catch (detailsError) {
      // Don't fail project creation if ProjectDetails creation fails
      console.error('[Project] Warning: Failed to create ProjectDetails:', detailsError);
    }

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
export const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user owns this project or is admin
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project',
      });
    }

    // Don't allow changing owner through this endpoint
    delete req.body.owner;
    delete req.body.ownerEmail;

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user owns this project or is admin
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project',
      });
    }

    await project.deleteOne();

    // Also delete associated sensors
    await Sensor.deleteMany({ project: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
    });
  }
};

// @desc    Add team member to project
// @route   POST /api/projects/:id/team
// @access  Private
export const addTeamMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user owns this project or is admin
    if (
      project.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this project',
      });
    }

    // Check if user already in team
    const exists = project.teamMembers.some(
      (member) => member.user.toString() === userId
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'User already in project team',
      });
    }

    project.teamMembers.push({ user: userId, role });
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Team member added successfully',
      data: project,
    });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding team member',
    });
  }
};

// @desc    Update sensor monitoring configuration
// @route   PUT /api/projects/:id/sensor-monitoring-config
// @access  Private/Admin
export const updateSensorMonitoringConfig = async (req, res) => {
  try {
    const { alarms, sensors } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is admin or project owner
    if (
      req.user.role !== 'admin' &&
      project.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update sensor configuration',
      });
    }

    // Update sensor monitoring configuration
    project.sensorMonitoringConfig = {
      alarms: alarms || [],
      sensors: sensors || [],
    };

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Sensor monitoring configuration updated successfully',
      data: project.sensorMonitoringConfig,
    });
  } catch (error) {
    console.error('Update sensor monitoring config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating sensor monitoring configuration',
    });
  }
};
