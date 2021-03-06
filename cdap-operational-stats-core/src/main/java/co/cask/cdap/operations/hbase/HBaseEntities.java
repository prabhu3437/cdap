/*
 * Copyright © 2016 Cask Data, Inc.
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

package co.cask.cdap.operations.hbase;

import co.cask.cdap.operations.OperationalStats;
import com.google.common.annotations.VisibleForTesting;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.hbase.HBaseConfiguration;
import org.apache.hadoop.hbase.client.HBaseAdmin;

import java.io.IOException;

/**
 * {@link OperationalStats} representing HBase entity (namespaces, tables, snapshots) statistics.
 */
public class HBaseEntities extends AbstractHBaseStats implements HBaseEntitiesMXBean {

  private int namespaces;
  private int tables;
  private int snapshots;

  @SuppressWarnings("unused")
  public HBaseEntities() {
    this(HBaseConfiguration.create());
  }

  @VisibleForTesting
  HBaseEntities(Configuration conf) {
    super(conf);
  }

  @Override
  public String getStatType() {
    return "entities";
  }

  @Override
  public int getNamespaces() {
    return namespaces;
  }

  @Override
  public int getTables() {
    return tables;
  }

  @Override
  public int getSnapshots() {
    return snapshots;
  }

  @Override
  public void collect() throws IOException {
    try (HBaseAdmin admin = new HBaseAdmin(conf)) {
      namespaces = admin.listNamespaceDescriptors().length;
      tables = admin.listTables().length;
      snapshots = admin.listSnapshots().size();
    }
  }
}
