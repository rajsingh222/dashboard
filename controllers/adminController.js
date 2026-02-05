import User from '../models/User.js';
import Project from '../models/Project.js';
import ProjectDetails from '../models/ProjectDetails.js';
import Sensor from '../models/Sensor.js';
import SensorReading from '../models/SensorReading.js';
import Alert from '../models/Alert.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;

    let query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get user's projects
    const projects = await Project.find({ owner: user._id });

    res.status(200).json({
      success: true,
      data: {
        user,
        projectCount: projects.length,
        projects,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const { role, isActive, assignedProjects, ...otherFields } = req.body;

    const updateData = { ...otherFields };

    // Admin can update role and active status
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (assignedProjects !== undefined) updateData.assignedProjects = assignedProjects;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate('assignedProjects', 'projectName projectId status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
    });
  }
};

// @desc    Change user password (Admin)
// @route   PUT /api/admin/users/:id/change-password
// @access  Private/Admin
export const changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update password (will be hashed by pre-save hook in User model)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProjects,
      activeProjects,
      totalSensors,
      activeSensors,
      totalAlerts,
      activeAlerts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Project.countDocuments(),
      Project.countDocuments({ isActive: true }),
      Sensor.countDocuments(),
      Sensor.countDocuments({ status: 'active' }),
      Alert.countDocuments(),
      Alert.countDocuments({ status: 'active' }),
    ]);

    // Get user growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const newProjects = await Project.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get project status distribution
    const projectStatusDistribution = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get sensor type distribution
    const sensorTypeDistribution = await Sensor.aggregate([
      {
        $group: {
          _id: '$sensorType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email role createdAt');

    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('owner', 'fullName email')
      .select('projectName projectId status createdAt owner');

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalProjects,
          activeProjects,
          totalSensors,
          activeSensors,
          totalAlerts,
          activeAlerts,
        },
        growth: {
          newUsers,
          newProjects,
        },
        distributions: {
          roles: roleDistribution,
          projectStatus: projectStatusDistribution,
          sensorTypes: sensorTypeDistribution,
        },
        recentActivity: {
          users: recentUsers,
          projects: recentProjects,
        },
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
    });
  }
};

// @desc    Get all projects (admin view)
// @route   GET /api/admin/projects
// @access  Private/Admin
export const getAllProjects = async (req, res) => {
  try {
    const { status, search } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { projectName: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Project.find(query)
      .populate('owner', 'fullName email phoneNumber')
      .populate('sensors')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
    });
  }
};

// @desc    Get all sensors (admin view)
// @route   GET /api/admin/sensors
// @access  Private/Admin
export const getAllSensors = async (req, res) => {
  try {
    const { status, sensorType, search } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (sensorType) {
      query.sensorType = sensorType;
    }

    if (search) {
      query.$or = [
        { sensorName: { $regex: search, $options: 'i' } },
        { sensorId: { $regex: search, $options: 'i' } },
      ];
    }

    const sensors = await Sensor.find(query)
      .populate('project', 'projectName projectId owner')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: sensors.length,
      data: sensors,
    });
  } catch (error) {
    console.error('Get all sensors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sensors',
    });
  }
};

// @desc    Get all alerts (admin view)
// @route   GET /api/admin/alerts
// @access  Private/Admin
export const getAllAlerts = async (req, res) => {
  try {
    const { status, severity, alertType } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (severity) {
      query.severity = severity;
    }

    if (alertType) {
      query.alertType = alertType;
    }

    const alerts = await Alert.find(query)
      .populate('project', 'projectName projectId')
      .populate('sensor', 'sensorName sensorId')
      .populate('acknowledgedBy', 'fullName email')
      .populate('resolvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    console.error('Get all alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching alerts',
    });
  }
};

// @desc    Get system health
// @route   GET /api/admin/system/health
// @access  Private/Admin
export const getSystemHealth = async (req, res) => {
  try {
    // Get offline sensors
    const offlineSensors = await Sensor.find({
      status: { $in: ['inactive', 'faulty'] },
    })
      .populate('project', 'projectName')
      .limit(20);

    // Get critical alerts
    const criticalAlerts = await Alert.find({
      severity: 'critical',
      status: 'active',
    })
      .populate('project', 'projectName')
      .populate('sensor', 'sensorName')
      .limit(20);

    // Check database connection
    const dbStatus = {
      connected: true,
      name: 'dashboard_sppl',
    };

    res.status(200).json({
      success: true,
      data: {
        database: dbStatus,
        offlineSensors: {
          count: offlineSensors.length,
          sensors: offlineSensors,
        },
        criticalAlerts: {
          count: criticalAlerts.length,
          alerts: criticalAlerts,
        },
      },
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system health',
    });
  }
};

// @desc    Create admin user
// @route   POST /api/admin/create-admin
// @access  Private/Admin
export const createAdminUser = async (req, res) => {
  try {
    const { fullName, email, userName, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ $or: [{ email }, { userName }] });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Create admin user
    const user = await User.create({
      fullName,
      email,
      userName,
      password,
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        userName: user.userName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin user',
    });
  }
};

// @desc    Assign project to user
// @route   POST /api/admin/users/:userId/assign-project
// @access  Private/Admin
export const assignProjectToUser = async (req, res) => {
  try {
    const { projectId } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if already assigned
    if (user.assignedProjects.includes(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Project already assigned to user',
      });
    }

    user.assignedProjects.push(projectId);
    await user.save();

    // Populate assigned projects before sending response
    await user.populate('assignedProjects', 'projectName projectId status');

    res.status(200).json({
      success: true,
      message: 'Project assigned successfully',
      data: {
        user,
        project: {
          id: project._id,
          projectName: project.projectName,
          projectId: project.projectId,
        },
      },
    });
  } catch (error) {
    console.error('Assign project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning project',
    });
  }
};

// @desc    Remove project from user
// @route   DELETE /api/admin/users/:userId/remove-project/:projectId
// @access  Private/Admin
export const removeProjectFromUser = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.assignedProjects = user.assignedProjects.filter(
      (p) => p.toString() !== projectId
    );
    await user.save();

    // Populate assigned projects before sending response
    await user.populate('assignedProjects', 'projectName projectId status');

    res.status(200).json({
      success: true,
      message: 'Project removed successfully',
      data: {
        user,
        remainingProjects: user.assignedProjects.length,
      },
    });
  } catch (error) {
    console.error('Remove project error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing project',
    });
  }
};

// @desc    Create project for user (admin only)
// @route   POST /api/admin/projects/create
// @access  Private/Admin
export const createProjectForUser = async (req, res) => {
  try {
    const {
      projectName,
      projectId,
      userId,
      description,
      location,
      projectType,
      status,
      startDate,
      endDate,
      client,
      testingAgency,
    } = req.body;

    // Find the user who will own this project
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if project ID already exists
    const existingProject = await Project.findOne({ projectId });
    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: 'Project ID already exists',
      });
    }

    // Create project
    const project = await Project.create({
      projectName,
      projectId,
      owner: userId,
      ownerEmail: user.email,
      description,
      location,
      projectType,
      status: status || 'planning',
      startDate,
      endDate,
      client,
      testingAgency,
    });

    // Assign project to user
    if (!user.assignedProjects.includes(project._id)) {
      user.assignedProjects.push(project._id);
      await user.save();
    }

    // Create corresponding ProjectDetails entry for seamless integration
    try {
      const projectDetailsData = {
        project_id: project._id.toString(),
        project_title: projectName,
        structure_type: projectType || 'building',
        construction_date: startDate || null,
        area: location?.address || '',
        city: location?.city || '',
        country: location?.country || 'India',
        latitude: location?.coordinates?.latitude || null,
        longitude: location?.coordinates?.longitude || null,
        updated_by: req.user?.email || user.email
      };

      await ProjectDetails.create(projectDetailsData);
      console.log('[Admin] ProjectDetails created automatically for new project:', projectId);
    } catch (detailsError) {
      // Don't fail project creation if ProjectDetails creation fails
      console.error('[Admin] Warning: Failed to create ProjectDetails:', detailsError);
    }

    res.status(201).json({
      success: true,
      message: 'Project created and assigned successfully',
      data: project,
    });
  } catch (error) {
    console.error('Create project for user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message,
    });
  }
};

// @desc    Get user's assigned projects
// @route   GET /api/admin/users/:userId/projects
// @access  Private/Admin
export const getUserProjects = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).populate({
      path: 'assignedProjects',
      select: 'projectName projectId status location projectType startDate endDate',
      populate: {
        path: 'sensors',
        select: 'sensorId sensorType status',
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user.assignedProjects,
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user projects',
    });
  }
};

// @desc    Get project by ID (admin view with full details)
// @route   GET /api/admin/projects/:id
// @access  Private/Admin
export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'fullName email userName phoneNumber organization')
      .populate('teamMembers.user', 'fullName email role')
      .populate('sensors');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
    });
  }
};

// @desc    Update any project (admin override)
// @route   PUT /api/admin/projects/:id
// @access  Private/Admin
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate('owner', 'fullName email');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Sync with ProjectDetails - update or create if doesn't exist
    try {
      const projectDetailsData = {
        project_id: project._id.toString(),
        project_title: req.body.projectName || project.projectName,
        structure_type: req.body.projectType || project.projectType,
        construction_date: req.body.startDate || project.startDate,
        area: req.body.location?.address || project.location?.address || '',
        city: req.body.location?.city || project.location?.city || '',
        country: req.body.location?.country || project.location?.country || 'India',
        latitude: req.body.location?.coordinates?.latitude || project.location?.coordinates?.latitude,
        longitude: req.body.location?.coordinates?.longitude || project.location?.coordinates?.longitude,
        updated_by: req.user?.email || 'admin'
      };

      await ProjectDetails.findOneAndUpdate(
        { project_id: project._id.toString() },
        projectDetailsData,
        { upsert: true, new: true }
      );

      console.log('[Admin] Project and ProjectDetails synced successfully for:', project.projectId);
    } catch (syncError) {
      console.error('[Admin] Error syncing ProjectDetails:', syncError);
      // Don't fail the main update if sync fails
    }

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
      error: error.message,
    });
  }
};

// @desc    Delete any project (admin override)
// @route   DELETE /api/admin/projects/:id
// @access  Private/Admin
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Remove project from all users' assignedProjects
    await User.updateMany(
      { assignedProjects: req.params.id },
      { $pull: { assignedProjects: req.params.id } }
    );

    await project.deleteOne();

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

// @desc    Assign threshold alerts PDF to project
// @route   POST /api/admin/projects/:id/assign-threshold-pdf
// @access  Private/Admin
export const assignThresholdPdf = async (req, res) => {
  try {
    const { fileUrl, fileName } = req.body;
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    project.thresholdAlertsPdf = {
      fileName: fileName || 'threshold_alerts.pdf',
      fileUrl,
      uploadDate: new Date(),
      uploadedBy: req.user?.email || 'admin',
    };

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Threshold alerts PDF assigned successfully',
      data: project.thresholdAlertsPdf,
    });
  } catch (error) {
    console.error('Assign threshold PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning threshold PDF',
    });
  }
};
