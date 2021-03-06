/*
 * Copyright © 2017 Cask Data, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

package co.cask.cdap.internal.app.runtime.schedule;

import co.cask.cdap.api.ProgramStatus;
import co.cask.cdap.api.app.ProgramType;
import co.cask.cdap.api.schedule.ConstraintProgramScheduleBuilder;
import co.cask.cdap.api.schedule.ScheduleBuilder;
import co.cask.cdap.internal.app.runtime.schedule.constraint.ConcurrencyConstraint;
import co.cask.cdap.internal.app.runtime.schedule.constraint.DelayConstraint;
import co.cask.cdap.internal.app.runtime.schedule.constraint.LastRunConstraint;
import co.cask.cdap.internal.app.runtime.schedule.constraint.TimeRangeConstraint;
import co.cask.cdap.internal.app.runtime.schedule.store.Schedulers;
import co.cask.cdap.internal.app.runtime.schedule.trigger.PartitionTriggerBuilder;
import co.cask.cdap.internal.app.runtime.schedule.trigger.ProgramStatusTriggerBuilder;
import co.cask.cdap.internal.app.runtime.schedule.trigger.TimeTriggerBuilder;
import co.cask.cdap.internal.schedule.ScheduleCreationBuilder;
import co.cask.cdap.internal.schedule.trigger.TriggerBuilder;
import co.cask.cdap.proto.ProtoConstraint;
import co.cask.cdap.proto.id.DatasetId;
import co.cask.cdap.proto.id.NamespaceId;
import com.google.common.collect.ImmutableMap;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TimeZone;
import java.util.concurrent.TimeUnit;

/**
 * The default implementation of {@link ScheduleBuilder}.
 */
public class DefaultScheduleBuilder implements ConstraintProgramScheduleBuilder {

  private final String name;
  private final NamespaceId namespace;
  private final String programName;
  private final List<ProtoConstraint> constraints;
  private String description;
  private Map<String, String> properties;
  private long timeoutMillis = Schedulers.JOB_QUEUE_TIMEOUT_MILLIS;

  public DefaultScheduleBuilder(String name, NamespaceId namespace, String programName) {
    this.name = name;
    this.description = "";
    this.namespace = namespace;
    this.programName = programName;
    this.properties = new HashMap<>();
    this.constraints = new ArrayList<>();
  }

  @Override
  public ScheduleBuilder setDescription(String description) {
    this.description = description;
    return this;
  }

  @Override
  public ScheduleBuilder setProperties(Map<String, String> properties) {
    this.properties = ImmutableMap.copyOf(properties);
    return this;
  }

  @Override
  public ScheduleBuilder setTimeout(long time, TimeUnit unit) {
    this.timeoutMillis = unit.toMillis(time);
    return this;
  }

  @Override
  public ConstraintProgramScheduleBuilder withConcurrency(int max) {
    constraints.add(new ConcurrencyConstraint(max));
    return this;
  }

  @Override
  public ScheduleBuilder withDelay(long delay, TimeUnit timeUnit) {
    constraints.add(new DelayConstraint(delay, timeUnit));
    return this;
  }

  @Override
  public ConstraintProgramScheduleBuilder withTimeWindow(String startTime, String endTime) {
    constraints.add(new TimeRangeConstraint(startTime, endTime, TimeZone.getDefault()));
    return this;
  }

  @Override
  public ConstraintProgramScheduleBuilder withTimeWindow(String startTime, String endTime, TimeZone timeZone) {
    constraints.add(new TimeRangeConstraint(startTime, endTime, timeZone));
    return this;
  }

  @Override
  public ConstraintProgramScheduleBuilder withDurationSinceLastRun(long duration, TimeUnit unit) {
    constraints.add(new LastRunConstraint(duration, unit));
    return this;
  }

  @Override
  public ScheduleCreationBuilder triggerByTime(String cronExpression) {
    return new ScheduleCreationBuilder(name, description, programName, properties, constraints, timeoutMillis,
                                       new TimeTriggerBuilder(cronExpression));
  }

  @Override
  public ScheduleCreationBuilder triggerOnPartitions(String datasetName, int numPartitions) {
    return new ScheduleCreationBuilder(name, description, programName, properties, constraints, timeoutMillis,
                                       new PartitionTriggerBuilder(namespace.dataset(datasetName), numPartitions));
  }

  @Override
  public ScheduleCreationBuilder triggerOnPartitions(String datasetNamespace, String datasetName, int numPartitions) {
    return new ScheduleCreationBuilder(name, description, programName, properties, constraints, timeoutMillis,
                                       new PartitionTriggerBuilder(new DatasetId(datasetNamespace, datasetName),
                                                                   numPartitions));
  }

  @Override
  public ScheduleCreationBuilder triggerOnProgramStatus(String programNamespace, String application, String appVersion,
                                                        ProgramType programType, String program,
                                                        ProgramStatus... programStatuses) {
    return new ScheduleCreationBuilder(name, description, programName, properties, constraints, timeoutMillis,
                                       new ProgramStatusTriggerBuilder(programNamespace, application, appVersion,
                                                                       programType.toString(), program,
                                                                       programStatuses));
  }

  @Override
  public ScheduleCreationBuilder triggerOnProgramStatus(String programNamespace, String application,
                                                        ProgramType programType, String program,
                                                        ProgramStatus... programStatuses) {
    return new ScheduleCreationBuilder(name, description, programName, properties, constraints, timeoutMillis,
                                       new ProgramStatusTriggerBuilder(programNamespace, application, null,
                                                                       programType.toString(), program,
                                                                       programStatuses));
  }

  @Override
  public ScheduleCreationBuilder triggerOnProgramStatus(String programNamespace, ProgramType programType,
                                                        String program, ProgramStatus... programStatuses) {
    return new ScheduleCreationBuilder(name, description, programName, properties, constraints, timeoutMillis,
                                       new ProgramStatusTriggerBuilder(programNamespace, null, null,
                                                                       programType.toString(), program,
                                                                       programStatuses));
  }

  @Override
  public ScheduleCreationBuilder triggerOnProgramStatus(ProgramType programType, String program,
                                                        ProgramStatus... programStatuses) {
    return new ScheduleCreationBuilder(name, description, programName, properties, constraints, timeoutMillis,
                                       new ProgramStatusTriggerBuilder(null, null, null,
                                                                       programType.toString(), program,
                                                                       programStatuses));
  }

  @Override
  public ScheduleBuilder waitUntilMet() {
    // user will only be able to call waitUntilMet right after they add a Constraint
    constraints.get(constraints.size() - 1).setWaitUntilMet(true);
    return this;
  }

  @Override
  public ScheduleBuilder abortIfNotMet() {
    // user will only be able to call abortIfNotMet right after they add a Constraint
    constraints.get(constraints.size() - 1).setWaitUntilMet(false);
    return this;
  }
}
